import * as https from 'https'
import { logger } from '../tools/logger'
import fetch, { Response } from 'node-fetch'
import { IncomingHttpHeaders } from 'http'

type HeaderName = string

export interface Event {
  body: object
  rawBody: string
  headers: IncomingHttpHeaders
}

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

export const forwardEvent = async ({
  rawBody,
  headers
}: Event, receivers: string[], headersToForward: HeaderName[]): Promise<void> => {
  const pendingForwards = receivers.map(async (address) => {
    logger.debug(`Forwarding to ${address}`)

    return await fetch(address, {
      method: 'POST',
      body: rawBody,
      headers: prepareHeaders(headers, headersToForward),
      ...((process.env.IGNORE_DESTINATION_SSL_ERRORS === 'true') && { agent: httpsAgent })
    })
  })

  try {
    const responses: Array<Awaited<Response>> = await Promise.all(pendingForwards)
    logger.info(
      responses.map((response: Response) => `Response received from URL: ${response.url}, status: ${response.status}`)
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Forwarding error: ${error.message}`)
    } else {
      logger.error(`Forwarding unknown error: ${error}`)
    }
  }
}

const prepareHeaders = (receivedHeaders: IncomingHttpHeaders, headersToForward: HeaderName[]): { [key: HeaderName]: string } =>
  Object.keys(receivedHeaders)
    .filter((key) => headersToForward.includes(key))
    .filter((key) => Boolean(receivedHeaders[key]))
    .reduce((obj, key) => {
      const headerValue = receivedHeaders[key]

      return {
        ...obj,
        [key]: Array.isArray(headerValue) ? headerValue.join(',') : headerValue
      }
    }, {})
