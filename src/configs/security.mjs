import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import validator from 'validator';
import cors from 'cors';
import hpp from 'hpp';
import { config } from '#configs/variable.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const sanitizeValues = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return;
  }

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      obj[key] = validator.escape(value);
    } else if (typeof value === 'object') {
      sanitizeValues(value);
    }
  }
};

const sanitizer = (req, res, next) => {
  if (req.body) sanitizeValues(req.body);
  if (req.query) sanitizeValues(req.query);
  if (req.params) sanitizeValues(req.params);
  next();
};

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

  sanitize: sanitizer,

  hpp: hpp({
    whitelist: ['category', 'subdistrict', 'role'],
  }),

  cookieParser: cookieParser(config.SECRET),

  limit: {
    general: rateLimit({
      windowMs: 2 * 60 * 1000,
      limit: 50,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        status: 'error',
        message:
          'Terlalu banyak permintaan akses dengan tidak wajar, silakan coba lagi setelah 2 menit.',
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
          'Terlalu banyak percobaan masuk akun dengan tidak wajar, silakan coba lagi setelah 15 menit.',
      },
    }),

    admin: rateLimit({
      windowMs: 2 * 60 * 1000,
      limit: 80,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        status: 'error',
        message:
          'Terlalu banyak percobaan masuk akun yang tidak wajar, akses akan diberikan lagi setelah 2 menit.',
      },
    }),
  },
};

export const coreSecurity = [
  shield.sanitize,
  shield.hpp,
  shield.cors,
  shield.cookieParser,
  shield.helm,
];
