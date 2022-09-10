import winston, { format, transports } from 'winston'

const logFormat = format.printf(({
  level,
  message,
  timestamp
}) => {
  return `${timestamp} [${level}] ${message} `
})

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'debug',
  format: format.combine(
    format.colorize(),
    format.splat(),
    format.timestamp(),
    logFormat
  ),
  transports: [
    new transports.Console()
  ]
})
