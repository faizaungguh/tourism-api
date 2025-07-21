import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { logger } from '#app/logging.mjs';
import { publicRouter } from '#routes/public.mjs';
import { privateRouter } from '#routes/api.mjs';
import { handler } from '#middlewares/error.mjs';
import { shield } from '#configs/security.mjs';

export const web = express();

/** mode dev untuk menampilkan log pad terminal */
if (process.env.NODE_ENV === 'development') {
  web.use(morgan('dev'));
  logger.info('Morgan logger aktif pada mode development.');
}

/** Route public dan private */
web.use(express.json({ limit: '15kb' }));
web.use(shield.cors, shield.session, shield.helm);

/** Route */
web.use('/', shield.generalLimiter, publicRouter);
web.use('/api', shield.adminLimiter, privateRouter);

web.use(handler.notFoundEndpoint);
web.use(handler.error);
