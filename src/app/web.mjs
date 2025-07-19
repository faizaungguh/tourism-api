import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { logger } from '#app/logging.mjs';
import { publicRouter } from '#routes/public.mjs';
import { privateRouter } from '#routes/api.mjs';
import { handler } from '#middlewares/error.mjs';

export const web = express();

/** mode dev untuk menampilkan log pad terminal */
if (process.env.NODE_ENV === 'development') {
  web.use(morgan('dev'));
  logger.info('Morgan logger aktif pada mode development.');
}

/** Route public dan private */
web.use(express.json());
web.use(cookieParser());

/** Route */
web.use('/', publicRouter);
web.use('/', handler.method(publicRouter));
web.use('/api', privateRouter);
web.use('/api', handler.method(privateRouter));

web.use(handler.notFoundEndpoint);
web.use(handler.error);
