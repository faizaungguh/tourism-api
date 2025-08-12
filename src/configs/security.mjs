import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from '#configs/variable.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import mongoSanitize from 'express-mongo-sanitize';
import xss from '';

const whitelist = ['http://localhost:3000'];

export const shield = {
  cors: cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new ResponseError(500, 'Tidak diizinkan oleh CORS'));
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

  sanitize: mongoSanitize(),

  hpp: hpp({
    whitelist: ['category', 'subdistrict', 'role'],
  }),

  session: cookieParser({
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: config === 'production',
      httpOnly: true,
    },
  }),

  limit: {
    general: rateLimit({
      windowMs: 1 * 60 * 1000,
      limit: 50,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        status: 'error',
        message:
          'Terlalu banyak permintaan akses dengan tidak wajar, akses akan diberikan lagi setelah 1 menit.',
      },
    }),

    auth: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        status: 'error',
        message:
          'Terlalu banyak percobaan masuk akun dengan tidak wajar, akses akan diberikan lagi setelah 15 menit.',
      },
    }),

    admin: rateLimit({
      windowMs: 1 * 60 * 1000,
      limit: 50,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        status: 'error',
        message:
          'Terlalu banyak percobaan masuk akun yang tidak wajar, akses akan diberikan lagi setelah 1 menit.',
      },
    }),
  },
};

export const coreSecurity = [shield.sanitize, shield.hpp, shield.cors, shield.session, shield.helm];
