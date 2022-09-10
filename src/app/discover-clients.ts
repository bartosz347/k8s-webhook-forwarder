import { CoreV1Api, KubeConfig } from '@kubernetes/client-node'
import { truthyFilter } from '../tools/truthy-filter'
import { logger } from '../tools/logger'

const REFRESH_INTERVAL_MS = 4 * 60 * 1000

interface ClientsList {
  clients: string[]
  lastUpdate: Date | null
}

const discoverClients = (): () => Promise<string[]> => {
  const clientsList: ClientsList = {
    clients: [],
    lastUpdate: null
  }

  return async () => {
    if (shouldRefreshClientsList(clientsList)) {
      logger.debug('Updating clients list')

      clientsList.clients = process.env.STATIC_CLIENTS_MODE === 'true'
        ? getStaticClients()
        : await getClientsFromKubernetes()
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

const getStaticClients = (): string[] =>
  process.env.STATIC_CLIENT !== null && process.env.STATIC_CLIENT !== undefined && process.env.STATIC_CLIENT !== ''
    ? [process.env.STATIC_CLIENT]
    : []

const initKubernetesClient = () => {
  const kubeConfig = new KubeConfig()

  // Access API via a service account
  kubeConfig.loadFromDefault()

  return kubeConfig.makeApiClient(CoreV1Api)
}

const getClientsFromKubernetes = async (): Promise<string[]> => {
  // TODO: confirm domain
  const clusterDomain = 'cluster.local'
  const fieldSelector = `metadata.name=${process.env.TARGET_SERVICE_NAME}`

  const endpoint = process.env.WEBHOOK_DESTINATION_ENDPOINT

  const k8sApi = initKubernetesClient()
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
    }) => `http://${serviceName}.${namespace}.svc.${clusterDomain}:${ports?.at(0)?.port}/${endpoint}`)
}

export default discoverClients()
