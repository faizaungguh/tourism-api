import express from 'express';
import morgan from 'morgan';
import { logger, stream } from '#app/logging.mjs';
import { coreSecurity, shield } from '#configs/security.mjs';
import { publicRouter } from '#routes/public.mjs';
import { privateRouter } from '#routes/api.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';
import { handler } from '#middlewares/error.mjs';
import { config } from '#configs/variable.mjs';

export const web = express();

/** mode dev untuk menampilkan log pad terminal */
if (config.NODE_ENV === 'development') {
  web.use(morgan('dev'));
  logger.info('Morgan logger aktif pada mode development.');
} else {
  web.use(morgan('combined', { stream }));
}

/** Route public dan private */
web.use(express.json({ limit: '15kb' }));
web.use(coreSecurity);

/** Route */
web.use('/', shield.limit.general, publicRouter);
web.use('/api', authMiddleware.protect, shield.limit.admin, privateRouter);
web.use(express.static('public'));

web.use(handler.notFoundEndpoint);
web.use(handler.error);
