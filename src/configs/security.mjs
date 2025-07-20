import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';

const whitelist = ['http://localhost:3000'];

export const shield = {
  cors: cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Tidak diizinkan oleh CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  }),

  helm: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      },
    },
  }),

  session: cookieParser({
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      httpOnly: true,
    },
  }),

  generalLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      status: 'error',
      message:
        'Terlalu banyak permintaan dengan tidak wajar, silakan coba lagi setelah 15 menit.',
    },
  }),

  authLimiter: rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      status: 'error',
      message:
        'Terlalu banyak percobaan masuk akun yang tidak wajar, silakan coba lagi setelah 15 menit.',
    },
  }),
};
