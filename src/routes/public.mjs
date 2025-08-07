import express from 'express';
import { auth } from '#controllers/auth.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { shield } from '#configs/security.mjs';
import { handler } from '#middlewares/error.mjs';
import { media } from '#controllers/media.mjs';
import { handleMedia } from '#middlewares/media.mjs';
import { mediaService } from '#services/media.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter
  .route('/signup')
  .post(shield.authLimiter, auth.register)
  .all(handler.method(['POST']));

publicRouter
  .route('/signin')
  .post(shield.authLimiter, auth.signin)
  .all(handler.method(['POST']));

/** Category */
publicRouter
  .route('/categories')
  .get(category.get)
  .all(handler.method(['GET']));

/** Subdistricts */
publicRouter
  .route('/subdistricts')
  .get(subdistrict.get)
  .all(handler.method(['GET']));

/** Destination */
publicRouter
  .route('/destinations/:slug')
  .get(destination.detail)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations')
  .get(destination.list)
  .all(handler.method(['GET']));

/** Recommendation */
// publicRouter.route('/destinations/recommendations')

/** Media */
publicRouter
  .route('/admins/:id/media')
  .get(handleMedia.admin.get, media.admin.getProfile)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:slug/gallery/:photoId')
  .get(handleMedia.destination.gallery.get, media.destination.gallery.get)
  .all(handler.method(['GET']));
