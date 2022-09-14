import { logger } from './tools/logger'
import app from './api/init-server'
import config from './config'

logger.info('Initializing app')

config.init()

app.listen(8000)

logger.info('App is ready')
