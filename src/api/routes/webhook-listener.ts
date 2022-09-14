import discoverClients from '../../app/discover-clients'
import { Event, forwardEvent } from '../../app/forward-events'

export const webhookListener = async (event: Event): Promise<void> => {
  const clients = await discoverClients()

  void forwardEvent(event, clients)
}
