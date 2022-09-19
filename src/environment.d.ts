declare namespace NodeJS {
  interface ProcessEnv {
    HEADERS_TO_FORWARD: string
    TARGET_NAME: string
    WEBHOOK_DESTINATION_ENDPOINT: string
    IGNORE_DESTINATION_SSL_ERRORS: string
    CLIENT_DISCOVERY_MODE: 'SERVICE' | 'INGRESS' | 'STATIC'
    STATIC_CLIENT: string
  }
}
