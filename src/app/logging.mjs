import winston from 'winston';
import path from 'path';
import { config } from '#configs/variable.mjs';

const isDevelopment = config.NODE_ENV === 'development';

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

winston.addColors(customLevels.colors);

const formats = {
  console: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} ${level}: ${message}`;
      if (stack) {
        log += `\n${stack}`;
      }
      if (Object.keys(meta).length) {
        log += `\n${JSON.stringify(meta, null, 2)}`;
      }
      return log;
    })
  ),
  file: winston.format.combine(winston.format.timestamp(), winston.format.json()),
};

const transports = [
  new winston.transports.Console({
    format: formats.console,
  }),
];

if (!isDevelopment) {
  const logDir = 'logs';
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: winston.format.json(),
    })
  );
}

export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(winston.format.errors({ stack: true })),
  transports: transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'exceptions.log') }),
    new winston.transports.Console({ format: formats.console }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'rejections.log') }),
    new winston.transports.Console({ format: formats.console }),
  ],
});

export const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};
