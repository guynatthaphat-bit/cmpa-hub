import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'cmpa-hub' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'passwordHash',
      '*.password',
      '*.passwordHash',
      'authorization',
      'cookie',
      '*.authorization',
      '*.cookie',
    ],
    censor: '[REDACTED]',
  },
})
