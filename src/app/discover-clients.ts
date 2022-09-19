import { CoreV1Api, KubeConfig, NetworkingV1Api } from '@kubernetes/client-node'
import { truthyFilter } from '../tools/truthy-filter'
import { logger } from '../tools/logger'
import config from '../config'

const REFRESH_INTERVAL_MS = 4 * 60 * 1000

interface ClientsList {
  clients: string[]
  lastUpdate: Date | null
}

export interface ClientDiscoveryConfig {
  apiPath: string
  targetName: string
  clientDiscoveryMode: 'SERVICE' | 'INGRESS' | 'STATIC'
  staticClients: string[]
}

const discoverClients = (): () => Promise<string[]> => {
  const clientsList: ClientsList = {
    clients: [],
    lastUpdate: null
  }

  return async () => {
    if (shouldRefreshClientsList(clientsList)) {
      logger.debug('Updating clients list')

      clientsList.clients = await getClients()
      clientsList.lastUpdate = new Date()

      logger.debug(`Clients found:\n\t${clientsList.clients.join('\n\t')}`)

      return clientsList.clients
    }

    return clientsList.clients
  }
}

const shouldRefreshClientsList = (clientsList: ClientsList): boolean => (
  clientsList.lastUpdate === null || (clientsList.lastUpdate.getTime() + REFRESH_INTERVAL_MS) < new Date().getTime()
)

const getClients = async (): Promise<string[]> => {
  switch (config.get().clientDiscoveryMode) {
    case 'SERVICE':
      return await getClientsFromKubernetesByServiceName(config.get().targetName, config.get().apiPath)
    case 'INGRESS':
      return await getClientsFromKubernetesByIngressName(config.get().targetName, config.get().apiPath)
    case 'STATIC':
      return getStaticClients(config.get().apiPath)

    default:
      throw new Error('Unsupported client discovery mode.')
  }
}

const getStaticClients = (apiPath: string): string[] =>
  config.get().staticClients.map(client => `${client}/${apiPath}`)

const getClientsFromKubernetesByServiceName = async (targetServiceName: string, apiPath: string): Promise<string[]> => {
  const clusterDomain = 'cluster.local'
  const fieldSelector = `metadata.name=${targetServiceName}`

  const k8sApi = initK8sCoreApiClient()
  const services = await k8sApi.listServiceForAllNamespaces(false, undefined, fieldSelector)

  return services.body.items
    .map((item) => (item.spec?.ports ?? []).length > 0
      ? {
          serviceName: item.metadata?.name,
          namespace: item.metadata?.namespace,
          ports: item.spec?.ports
        }
      : null)
    .filter(truthyFilter)
    .filter(config => Object.values(config).every(Boolean))
    .map(({
      serviceName,
      namespace,
      ports
    }) => `http://${serviceName}.${namespace}.svc.${clusterDomain}:${ports?.at(0)?.port}/${apiPath}`)
}

const getClientsFromKubernetesByIngressName = async (targetIngressName: string, apiPath: string): Promise<string[]> => {
  const fieldSelector = `metadata.name=${targetIngressName}`

  const k8sApi = initK8sNetworkApiClient()
  const ingresses = await k8sApi.listIngressForAllNamespaces(false, undefined, fieldSelector)

  const hosts = ingresses.body.items
    .filter(item => (item.spec?.rules !== undefined))
    .map(item => (item.spec?.rules))
    .map(item => item?.filter(rule => rule?.host !== undefined))
    .map(item => item?.map(rule => rule.host))
    .map(itemsHosts => (itemsHosts ?? [])[0])
    .filter(Boolean)

  return hosts.map(host => `https://${host}/${apiPath}`)
}

const initK8sCoreApiClient = (): CoreV1Api => {
  const kubeConfig = new KubeConfig()
  kubeConfig.loadFromDefault()

  return kubeConfig.makeApiClient(CoreV1Api)
}

const initK8sNetworkApiClient = (): NetworkingV1Api => {
  const kubeConfig = new KubeConfig()
  kubeConfig.loadFromDefault()

  return kubeConfig.makeApiClient(NetworkingV1Api)
}

export default discoverClients()
