import express from 'express';
import { shield } from '#configs/security.mjs';
import { handler } from '#middlewares/error.mjs';
import { middlewareMedia } from '#middlewares/media.mjs';
import { Control } from '#controllers/index.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter
  .route('/signup')
  .post(shield.limit.auth, Control.Data.auth.register)
  .all(handler.method(['POST']));

publicRouter
  .route('/signin')
  .post(shield.limit.auth, Control.Data.auth.signin)
  .all(handler.method(['POST']));

/** Category */
publicRouter
  .route('/categories')
  .get(Control.Data.category.list)
  .all(handler.method(['GET']));

/** Subdistricts */
publicRouter
  .route('/subdistricts')
  .get(Control.Data.subdistrict.list)
  .all(handler.method(['GET']));

/** Destination */
publicRouter
  .route('/destinations')
  .get(Control.Data.destination.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:slug')
  .get(Control.Data.destination.get)
  .all(handler.method(['GET']));

/** Recommendation */
publicRouter
  .route('/recommendations')
  .get(Control.Data.destination.showRecommendation)
  .all(handler.method(['GET']));

/** Media */
publicRouter
  .route('/admins/:id/media')
  .get(...middlewareMedia.admin.get, Control.Media.admin.getProfile)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/gallery')
  .get(...middlewareMedia.destination.gallery.list, Control.Media.destination.gallery.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/facility/:facility/media')
  .get(...middlewareMedia.destination.facility.list, Control.Media.destination.facility.list)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/:destinations/attractions/:attractions/media')
  .get(...middlewareMedia.destination.attraction.list, Control.Media.destination.attraction.list)
  .all(handler.method(['GET']));
