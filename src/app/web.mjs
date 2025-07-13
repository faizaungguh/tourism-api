import express from 'express';
import morgan from 'morgan';
import { logger } from '#app/logging.mjs';
import { publicRouter } from '#routes/public.mjs';
import { privateRouter } from '#routes/api.mjs';
import {
  errorHandler,
  methodHandler,
  notFoundEndpoint,
} from '../errors/error.mjs';

export const web = express();

/** mode dev untuk menampilkan log pad terminal */
if (process.env.NODE_ENV === 'development') {
  web.use(morgan('dev'));
  logger.info('Morgan logger aktif pada mode development.');
}

/** Route public dan private */
web.use(express.json());
web.use('/', publicRouter);
web.use('/', methodHandler(publicRouter));

/** menangani semua request valid */
web.use('/api', privateRouter);

/** periksa jika ada method yang tidak diperkenankan */
web.use('/api', methodHandler(privateRouter));

/** periksa jika tidak menemukan endpoint */
web.use(notFoundEndpoint);
/** menangkap semua error */
web.use(errorHandler);
