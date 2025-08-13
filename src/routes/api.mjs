import express from 'express';
import { mediaController, dataController } from '#controllers/index.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';
import { handler } from '#middlewares/error.mjs';
import { middlewareMedia } from '#middlewares/media.mjs';

export const privateRouter = new express.Router();

privateRouter
  .route('/signout')
  .delete(authMiddleware.authorize('admin', 'manager'), dataController.auth.signout)
  .all(handler.method(['DELETE']));

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.authorize('admin'))
  .post(dataController.admin.add)
  .get(dataController.admin.list)
  .all(handler.method(['GET', 'POST']));

privateRouter
  .route('/admin/:id')
  .all(authMiddleware.authorize('admin'))
  .get(dataController.admin.get)
  .put(dataController.admin.update)
  .delete(dataController.admin.delete)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Manager */
privateRouter
  .route('/managers')
  .get(authMiddleware.authorize('admin'), dataController.manager.list)
  .all(handler.method(['GET']));

privateRouter
  .route('/manager/:id')
  .get(authMiddleware.authorize('admin', 'manager'), dataController.manager.get)
  .put(authMiddleware.authorize('manager'), dataController.manager.update)
  .delete(authMiddleware.authorize('admin', 'manager'), dataController.manager.delete)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Category */
privateRouter
  .route('/categories')
  .post(authMiddleware.authorize('admin'), dataController.category.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/category/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(dataController.category.update)
  .delete(dataController.category.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Subdistrict */
privateRouter
  .route('/subdistricts')
  .post(authMiddleware.authorize('admin'), dataController.subdistrict.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/subdistrict/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(dataController.subdistrict.update)
  .delete(dataController.subdistrict.delete)
  .all(handler.method(['PUT', 'DELETE']));

/** Destination */
privateRouter
  .route('/destinations')
  .post(authMiddleware.authorize('manager'), dataController.destination.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/destination/:slug')
  .all(authMiddleware.authorize('manager'))
  .put(dataController.destination.update)
  .delete(dataController.destination.delete)
  .all(handler.method(['PUT', 'DELETE']));

privateRouter
  .route('/destination-raw')
  .all(authMiddleware.authorize('admin'))
  .get(dataController.destination.getRaw)
  .all(handler.method(['GET']));

/** Attraction */
privateRouter
  .route('/destination/:slug/attractions')
  .post(authMiddleware.authorize('manager'), dataController.attraction.add)
  .all(handler.method(['POST']));

privateRouter
  .route('/destination/:destinations/attractions/:attractions')
  .all(authMiddleware.authorize('manager'))
  .put(dataController.attraction.update)
  .delete(dataController.attraction.delete)
  .all(handler.method(['PUT', 'DELETE']));

/**=====================
 *  Media Upload
 * =====================
 */

/** Admin - photo */
privateRouter
  .route('/admin/:id/media')
  .all(authMiddleware.authorize('admin', 'manager'))
  .post(...middlewareMedia.admin.updateMedia, mediaController.admin.addProfile)
  .all(handler.method(['POST']));

/** Destinasi - profilePhoto, headlinePhoto */
privateRouter
  .route('/destination/:destinations/media')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.updateMedia, mediaController.destination.updateMedia)
  .all(handler.method(['POST']));

/** Destinasi - galleryPhoto */
privateRouter
  .route('/destination/:destinations/gallery')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.gallery.add, mediaController.destination.gallery.add)
  .delete(
    ...middlewareMedia.destination.gallery.deleteAll,
    mediaController.destination.gallery.deleteAll,
  )
  .all(handler.method(['POST', 'DELETE']));

privateRouter
  .route('/destination/:destinations/gallery/:id')
  .all(authMiddleware.authorize('manager'))
  .put(...middlewareMedia.destination.gallery.update, mediaController.destination.gallery.update)
  .delete(
    ...middlewareMedia.destination.gallery.deleteOne,
    mediaController.destination.gallery.delete,
  )
  .all(handler.method(['PUT', 'DELETE']));

/** Destinasi - facility - photo */
privateRouter
  .route('/destination/:destinations/facility/:facility/media')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.facility.add, mediaController.destination.facility.add)
  .delete(
    ...middlewareMedia.destination.facility.deleteAll,
    mediaController.destination.facility.deleteAll,
  )
  .all(handler.method(['POST', 'DELETE']));

privateRouter
  .route('/destination/:destinations/facility/:facility/media/:id')
  .all(authMiddleware.authorize('manager'))
  .put(...middlewareMedia.destination.facility.update, mediaController.destination.facility.update)
  .delete(
    middlewareMedia.destination.facility.deleteOne,
    mediaController.destination.facility.delete,
  )
  .all(handler.method(['PUT', 'DELETE']));

/** Wahana - photo */
privateRouter
  .route('/destination/:destinations/attraction/:attractions/media')
  .all(authMiddleware.authorize('manager'))
  .post(...middlewareMedia.destination.attraction.add, mediaController.destination.attraction.add)
  .delete(
    ...middlewareMedia.destination.attraction.deleteAll,
    mediaController.destination.attraction.deleteAll,
  )
  .all(handler.method(['POST', 'DELETE']));

privateRouter
  .route('/destination/:destinations/attraction/:attractions/media/:id')
  .all(authMiddleware.authorize('manager'))
  .put(
    ...middlewareMedia.destination.attraction.update,
    mediaController.destination.attraction.update,
  )
  .delete(
    ...middlewareMedia.destination.attraction.deleteOne,
    mediaController.destination.attraction.delete,
  )
  .all(handler.method(['PUT', 'DELETE']));
