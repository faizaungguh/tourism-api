import winston from 'winston';

const isDevelopment = process.env.NODE_ENV === 'development';

const transportConfigurations = [
  /** Konfigurasi untuk console, selalu aktif */
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;
        /** Jika ada stack trace (untuk error), tampilkan dengan rapi. */
        if (stack) {
          log += `\n${stack}`;
        }
        /** Jika ada metadata lain, tampilkan sebagai JSON. */
        if (Object.keys(meta).length) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return log;
      })
    ),
  }),
];

/** Untuk environment production, tambahkan logging ke file */
if (!isDevelopment) {
  transportConfigurations.push(
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'combined.log',
      format: winston.format.json(),
    })
  );
}

export const logger = winston.createLogger({
  /** Level log disesuaikan dengan environment. 'debug' untuk development. */
  level: isDevelopment ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({
      stack: true,
    }) /** Otomatis sertakan stack trace dari Error object */,
    winston.format.json() /** Format default untuk file */
  ),
  transports: transportConfigurations,
});
