import discoverClients from '../../app/discover-clients'
import { Event, forwardEvent } from '../../app/forward-events'

export const webhookListener = async (event: Event): Promise<void> => {
  // TODO: verify allowed sources of webhooks?

  const clients = await discoverClients()

  void forwardEvent(event, clients, (process.env.HEADERS_TO_FORWARD ?? '').split(','))
}
