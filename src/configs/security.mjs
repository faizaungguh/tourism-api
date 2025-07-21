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
    method: ['POST', 'GET', 'PUT', 'DELETE'],
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
    windowMs: 1 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      status: 'error',
      message:
        'Terlalu banyak permintaan akses dengan tidak wajar, silakan coba lagi setelah 1 menit.',
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
        'Terlalu banyak percobaan masuk akun dengan tidak wajar, silakan coba lagi setelah 15 menit.',
    },
  }),

  adminLimiter: rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
      status: 'error',
      message:
        'Terlalu banyak percobaan masuk akun yang tidak wajar, silakan coba lagi setelah 1 menit.',
    },
  }),
};
