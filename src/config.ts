import { ClientDiscoveryConfig } from './app/discover-clients'
import { EventForwardingConfig } from './app/forward-events'

type ConfigType = ClientDiscoveryConfig & EventForwardingConfig

export class Config {
  private config: ConfigType | null = null

  public init (): void {
    this.config = this.getFromEnvs()
  }

  public get (): ConfigType {
    if (this.config === null) {
      throw new Error('Config not initialized')
    }

    return this.config
  }

  private getFromEnvs (): ConfigType {
    return {
      apiPath: this.getEnvValue('WEBHOOK_DESTINATION_ENDPOINT'),
      targetServiceName: this.getEnvValue('TARGET_SERVICE_NAME'),
      headersToForward: this.getEnvValue('HEADERS_TO_FORWARD').split(','),
      ignoreDestinationSslErrors: process.env.IGNORE_DESTINATION_SSL_ERRORS === 'true',
      staticClientsMode: process.env.STATIC_CLIENTS_MODE === 'true',
      staticClients: (process.env.STATIC_CLIENT) !== undefined
        ? [process.env.STATIC_CLIENT]
        : []
    }
  }

  private getEnvValue (key: string): string {
    const value = process.env[key]

    if (value === undefined || value === null || value === '') {
      throw Error(`Required config parameter not provided or invalid: ${key}`)
    }

    return value
  }
}

export default new Config()
