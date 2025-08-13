import express from 'express';
import { shield } from '#configs/security.mjs';
import { handler } from '#middlewares/error.mjs';
import { middlewareMedia } from '#middlewares/media.mjs';
import { dataController, mediaController } from '#controllers/index.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter
  .route('/signup')
  .post(shield.limit.auth, dataController.auth.register)
  .all(handler.method(['POST']));

publicRouter
  .route('/signin')
  .post(shield.limit.auth, dataController.auth.signin)
  .all(handler.method(['POST']));

/** Category */
publicRouter
  .route('/categories')
  .get(dataController.category.list)
  .all(handler.method(['GET']));

/** Subdistricts */
publicRouter
  .route('/subdistricts')
  .get(dataController.subdistrict.list)
  .all(handler.method(['GET']));

/** Destination */
publicRouter
  .route('/destinations')
  .get(dataController.destination.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:slug')
  .get(dataController.destination.get)
  .all(handler.method(['GET']));

/** Recommendation */
publicRouter
  .route('/recommendations')
  .get(dataController.destination.showRecommendation)
  .all(handler.method(['GET']));

/** Media */
publicRouter
  .route('/admin/:id/media')
  .get(...middlewareMedia.admin.get, mediaController.admin.getProfile)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/gallery')
  .get(...middlewareMedia.destination.gallery.list, mediaController.destination.gallery.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/facility/:facility/media')
  .get(...middlewareMedia.destination.facility.list, mediaController.destination.facility.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/attractions/:attractions/media')
  .get(...middlewareMedia.destination.attraction.list, mediaController.destination.attraction.list)
  .all(handler.method(['GET']));
