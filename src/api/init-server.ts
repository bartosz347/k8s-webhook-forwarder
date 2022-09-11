import Koa from 'koa'
import Router from '@koa/router'
import { initRoutes } from './init-routes'

const app = new Koa()
const router = new Router()

initRoutes(router)

app
  .use(router.routes())
  .use(router.allowedMethods())

export default app
