import express from 'express';
import { shield } from '#configs/security.mjs';
import { handler } from '#middlewares/error.mjs';
import { media } from '#controllers/media.mjs';
import { data } from '#controllers/data.mjs';
import { handleMedia } from '#middlewares/media.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter
  .route('/signup')
  .post(shield.authLimiter, data.auth.register)
  .all(handler.method(['POST']));

publicRouter
  .route('/signin')
  .post(shield.authLimiter, data.auth.signin)
  .all(handler.method(['POST']));

/** Category */
publicRouter
  .route('/categories')
  .get(data.category.list)
  .all(handler.method(['GET']));

/** Subdistricts */
publicRouter
  .route('/subdistricts')
  .get(data.subdistrict.list)
  .all(handler.method(['GET']));

/** Destination */
publicRouter
  .route('/destinations')
  .get(data.destination.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:slug')
  .get(data.destination.get)
  .all(handler.method(['GET']));

/** Recommendation */
// publicRouter.route('/destinations/recommendations')

/** Media */
publicRouter
  .route('/admins/:id/media')
  .get(handleMedia.admin.get, media.admin.getProfile)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/gallery/:photoId')
  .get(handleMedia.destination.gallery.get, media.destination.gallery.get)
  .all(handler.method(['GET']));
