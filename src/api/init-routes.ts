import Router from '@koa/router'
import { Context } from 'koa'
import koaBody from 'koa-body'
import { webhookListener } from './routes/webhook-listener'
import { logger } from '../tools/logger'

const unparsed = Symbol.for('unparsedBody')

export const initRoutes = (router: Router): void => {
  router.get('/health', (ctx: Context) => {
    ctx.body = 'UP'
  })

  router.post('/webhook-listener', koaBody({ includeUnparsed: true }), async (ctx: Context) => {
    logger.debug(`Webhook received from ${ctx.socket.remoteAddress ?? 'unknown'}`)

    await webhookListener({
      rawBody: ctx.request.body[unparsed],
      body: ctx.request.body,
      headers: ctx.request.headers
    })

    ctx.body = 'OK'
    ctx.status = 200
  })
}
