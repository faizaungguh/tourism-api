import express from 'express';
import { Control } from '#controllers/index.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';
import { handler } from '#middlewares/error.mjs';
import { middlewareMedia } from '#middlewares/media.mjs';

export const privateRouter = new express.Router();

privateRouter
  .route('/signout')
  .delete(authMiddleware.authorize('admin', 'manager'), Control.Data.auth.signout)
  .all(handler.method(['DELETE']));

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.authorize('admin'))
  .post(Control.Data.admin.add)
  .get(Control.Data.admin.list)
  .all(handler.method(['GET', 'POST']));

privateRouter
  .route('/admin/:id')
  .all(authMiddleware.authorize('admin'))
  .get(Control.Data.admin.get)
  .put(Control.Data.admin.update)
  .delete(Control.Data.admin.delete)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Manager */
privateRouter
  .route('/managers')
  .get(authMiddleware.authorize('admin'), Control.Data.manager.list)
  .all(handler.method(['GET']));

privateRouter
  .route('/manager/:id')
  .get(authMiddleware.authorize('admin', 'manager'), Control.Data.manager.get)
  .put(authMiddleware.authorize('manager'), Control.Data.manager.update)
  .delete(authMiddleware.authorize('admin', 'manager'), Control.Data.manager.delete)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Category */
privateRouter
  .route('/categories')
  .post(authMiddleware.authorize('admin'), Control.Data.category.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/categories/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(Control.Data.category.update)
  .delete(Control.Data.category.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Subdistrict */
privateRouter
  .route('/subdistricts')
  .post(authMiddleware.authorize('admin'), Control.Data.subdistrict.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/subdistrict/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(Control.Data.subdistrict.update)
  .delete(Control.Data.subdistrict.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Destination */
privateRouter
  .route('/destinations')
  .post(authMiddleware.authorize('manager'), Control.Data.destination.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/destination/:slug')
  .all(authMiddleware.authorize('manager'))
  .put(Control.Data.destination.update)
  .delete(Control.Data.destination.delete)
  .all(handler.method(['PUT', 'DELETE']));

privateRouter
  .route('/destination-raw')
  .all(authMiddleware.authorize('admin'))
  .get(Control.Data.destination.getRaw)
  .all(handler.method(['GET']));

/** Attraction */
privateRouter
  .route('/destination/:slug/attractions')
  .post(authMiddleware.authorize('manager'), Control.Data.attraction.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/destination/:destinations/attractions/:attractions')
  .all(authMiddleware.authorize('manager'))
  .put(Control.Data.attraction.update)
  .delete(Control.Data.attraction.delete)
  .all(handler.method(['PUT', 'DELETE']));

/**=====================
 *  Media Upload
 * =====================
 */

/** Admin - photo */
privateRouter
  .route('/admins/:id/media')
  .all(authMiddleware.authorize('admin', 'manager'))
  .post(...middlewareMedia.admin.updateMedia, Control.Media.admin.addProfile)
  .all(handler.method(['POST']));

/** Destinasi - profilePhoto, headlinePhoto */
privateRouter
  .route('/destination/:destinations/media')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.updateMedia, Control.Media.destination.updateMedia)
  .all(handler.method(['POST']));

/** Destinasi - galleryPhoto */
privateRouter
  .route('/destination/:destinations/gallery')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.gallery.add, Control.Media.destination.gallery.add)
  .delete(
    ...middlewareMedia.destination.gallery.deleteAll,
    Control.Media.destination.gallery.deleteAll,
  );

privateRouter
  .route('/destination/:destinations/gallery/:id')
  .all(authMiddleware.authorize('manager'))
  .put(...middlewareMedia.destination.gallery.update, Control.Media.destination.gallery.update)
  .delete(
    ...middlewareMedia.destination.gallery.deleteOne,
    Control.Media.destination.gallery.delete,
  );

/** Destinasi - facility - photo */
privateRouter
  .route('/destination/:destinations/facility/:facility/media')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.facility.add, Control.Media.destination.facility.add)
  .delete(
    ...middlewareMedia.destination.facility.deleteAll,
    Control.Media.destination.facility.deleteAll,
  )
  .all(handler.method(['POST', 'GET', 'DELETE']));

privateRouter
  .route('/destination/:destinations/facility/:facility/media/:id')
  .all(authMiddleware.authorize('manager'))
  .put(...middlewareMedia.destination.facility.update, Control.Media.destination.facility.update)
  .delete(middlewareMedia.destination.facility.deleteOne, Control.Media.destination.facility.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Wahana - photo */
privateRouter
  .route('/destination/:destinations/attractions/:attractions/media')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.attraction.add, Control.Media.destination.attraction.add)
  .delete(
    ...middlewareMedia.destination.attraction.deleteAll,
    Control.Media.destination.attraction.deleteAll,
  )
  .all(handler.method(['POST', 'GET', 'DELETE']));

privateRouter
  .route('/destination/:destinations/attractions/:attractions/media/:id')
  .all(authMiddleware.authorize('manager'))
  .put(
    ...middlewareMedia.destination.attraction.update,
    Control.Media.destination.attraction.update,
  )
  .delete(
    ...middlewareMedia.destination.attraction.deleteOne,
    Control.Media.destination.attraction.delete,
  )
  .all(handler.method(['PUT', 'GET', 'DELETE']));
