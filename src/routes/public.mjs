import express from 'express';
import { shield } from '#configs/security.mjs';
import { media } from '#controllers/media.mjs';
import { data } from '#controllers/data.mjs';
import { handler } from '#middlewares/error.mjs';
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
publicRouter
  .route('/recommendations')
  .get(data.destination.showRecommendation)
  .all(handler.method(['GET']));

/** Media */
publicRouter
  .route('/admins/:id/media')
  .get(...handleMedia.admin.get, media.admin.getProfile)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/gallery')
  .get(...handleMedia.destination.gallery.list, media.destination.gallery.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/facility/:facility/media')
  .get(...handleMedia.destination.facility.list, media.destination.facility.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/attractions/:attractions/media')
  .get(...handleMedia.destination.attraction.list, media.destination.attraction.list)
  .all(handler.method(['GET']));
