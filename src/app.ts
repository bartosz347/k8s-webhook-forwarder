import { logger } from './tools/logger'
import app from './api/init-server'

logger.info('Initializing app')

app.listen(8000)

logger.info('App is ready')
