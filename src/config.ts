import { ClientDiscoveryConfig } from './app/discover-clients'
import { EventForwardingConfig } from './app/forward-events'
import * as process from 'process'

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
    const headersToAdd = this.getEnvValue('HEADERS_TO_ADD', '')

    return {
      apiPath: this.getEnvValue('WEBHOOK_DESTINATION_ENDPOINT'),
      targetName: this.getEnvValue('TARGET_NAME'),
      headersToForward: this.getEnvValue('HEADERS_TO_FORWARD').split(','),
      headersToAdd: headersToAdd !== ''
        ? Object.fromEntries(headersToAdd.split(',').map((header) => header.split(':')))
        : {},
      ignoreDestinationSslErrors: process.env.IGNORE_DESTINATION_SSL_ERRORS === 'true',
      clientDiscoveryMode: this.getEnvValue('CLIENT_DISCOVERY_MODE') as 'SERVICE' | 'INGRESS' | 'STATIC',
      staticClients: (process.env.STATIC_CLIENT) !== undefined
        ? [process.env.STATIC_CLIENT]
        : []
    }
  }

  private getEnvValue (key: string, defaultValue?: string): string {
    const value = process.env[key]

    if (value === undefined || value === null || value === '') {
      if (defaultValue !== undefined) {
        return defaultValue
      }
      throw Error(`Required config parameter not provided or invalid: ${key}`)
    }

    return value
  }
}

export default new Config()
