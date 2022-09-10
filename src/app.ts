import { initRoutes } from './api/init-routes'
import Router from '@koa/router'
import Koa from 'koa'
import { logger } from './tools/logger'

logger.info('Initializing app')

const app = new Koa()
const router = new Router()

initRoutes(router)

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(8000)

logger.info('App is ready')
