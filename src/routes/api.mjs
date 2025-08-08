import express from 'express';
import { data } from '#controllers/data.mjs';
import { media } from '#controllers/media.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';
import { handleMedia } from '#middlewares/media.mjs';
import { handler } from '#middlewares/error.mjs';

export const privateRouter = new express.Router();

privateRouter
  .route('/signout')
  .delete(authMiddleware.authorize('admin', 'manager'), data.auth.signout)
  .all(handler.method(['DELETE']));

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.authorize('admin'))
  .post(data.admin.add)
  .get(data.admin.list)
  .all(handler.method(['GET', 'POST']));

privateRouter
  .route('/admins/:id')
  .all(authMiddleware.authorize('admin'))
  .get(data.admin.get)
  .put(data.admin.update)
  .delete(data.admin.delete)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Manager */
privateRouter
  .route('/managers')
  .get(authMiddleware.authorize('admin'), data.manager.list)
  .all(handler.method(['GET']));

privateRouter
  .route('/managers/:id')
  .get(authMiddleware.authorize('admin', 'manager'), data.manager.get)
  .put(authMiddleware.authorize('manager'), data.manager.update)
  .delete(authMiddleware.authorize('admin', 'manager'), data.manager.delete)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Category */
privateRouter
  .route('/categories')
  .post(authMiddleware.authorize('admin'), data.category.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/categories/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(data.category.update)
  .delete(data.category.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Subdistrict */
privateRouter
  .route('/subdistricts')
  .post(authMiddleware.authorize('admin'), data.subdistrict.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/subdistricts/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(data.subdistrict.update)
  .delete(data.subdistrict.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Destination */
privateRouter
  .route('/destinations')
  .post(authMiddleware.authorize('manager'), data.destination.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/destinations/:slug')
  .all(authMiddleware.authorize('manager'))
  .put(data.destination.update)
  .delete(data.destination.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Attraction */
privateRouter
  .route('/destinations/:slug/attractions')
  .post(authMiddleware.authorize('manager'), data.attraction.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/destinations/:destinations/attractions/:attractions')
  .all(authMiddleware.authorize('manager'))
  .put(data.attraction.update)
  .delete(data.attraction.delete)
  .all(handler.method(['PUT', 'DELETE']));

/**=====================
 *  Media Upload
 * =====================
 */

/** Admin - photo */
privateRouter
  .route('/admins/:id/media')
  .all(authMiddleware.authorize('admin', 'manager'))
  .post(handleMedia.admin.updateMedia, media.admin.addProfile)
  .all(handler.method(['POST']));

/** Destinasi - profilePhoto, headlinePhoto */
privateRouter
  .route('/destinations/:destinations/media')
  .all(authMiddleware.authorize('manager'))
  .post(handleMedia.destination.updateMedia, media.destination.updateMedia)
  .all(handler.method(['POST']));

/** Destinasi - galleryPhoto */
privateRouter
  .route('/destinations/:destinations/gallery')
  .all(authMiddleware.authorize('manager'))
  .post(...handleMedia.destination.gallery.add, media.destination.gallery.add)
  .delete(...handleMedia.destination.gallery.deleteAll, media.destination.gallery.deleteAll);

privateRouter
  .route('/destinations/:destinations/gallery/:id')
  .all(authMiddleware.authorize('manager'))
  .put(...handleMedia.destination.gallery.update, media.destination.gallery.update)
  .delete(...handleMedia.destination.gallery.deleteOne, media.destination.gallery.delete);

/** Destinasi - facility - photo */
privateRouter
  .route('/destinations/:destinations/facility/:facility/media')
  .all(authMiddleware.authorize('manager'))
  .post(handleMedia.destination.facility.add, media.facility.add)
  // .get(media.facility.list)
  // .delete(media.facility.deleteAll)
  .all(handler.method(['POST', 'GET', 'DELETE']));

privateRouter
  .route('/destinations/:destinations/facility/:facility/media/:id')
  .all(authMiddleware.authorize('manager'))
  // .get(media.facility.get)
  // .put(media.facility.update)
  // .delete(media.facility.delete)
  .all(handler.method(['PUT', 'GET', 'DELETE']));

/** Wahana - photo */
privateRouter
  .route('/destinations/:destinations/attractions/:attractions/media')
  .all(authMiddleware.authorize('manager'))
  // .post(media.attraction.add)
  // .get(media.attraction.list)
  // .delete(media.attraction.deleteAll)
  .all(handler.method(['POST', 'GET', 'DELETE']));

privateRouter
  .route('/destinations/:destinations/attractions/:attractions/media/:id')
  .all(authMiddleware.authorize('manager'))
  // .get(media.attraction.get)
  // .put(media.attraction.update)
  // .delete(media.attraction.delete)
  .all(handler.method(['PUT', 'GET', 'DELETE']));
