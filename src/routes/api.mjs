import express from 'express';
import { admin } from '#controllers/admin.mjs';
import { manager } from '#controllers/manager.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { attraction } from '#controllers/attraction.mjs';
import { auth } from '#controllers/auth.mjs';
import { media } from '#controllers/media.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';
import { handler } from '#middlewares/error.mjs';
import { uploadMedia } from '#middlewares/media.mjs';

export const privateRouter = new express.Router();

privateRouter
  .route('/signout')
  .delete(authMiddleware.authorize('admin', 'manager'), auth.signout)
  .all(handler.method(['DELETE']));

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.authorize('admin'))
  .get(admin.list)
  .post(admin.post)
  .all(handler.method(['GET', 'POST']));

privateRouter
  .route('/admins/:id')
  .all(authMiddleware.authorize('admin'))
  .get(admin.get)
  .put(admin.patch)
  .delete(admin.drop)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Manager */
privateRouter
  .route('/managers')
  .get(authMiddleware.authorize('admin'), manager.list)
  .all(handler.method(['GET']));

privateRouter
  .route('/managers/:id')
  .get(authMiddleware.authorize('admin', 'manager'), manager.get)
  .put(authMiddleware.authorize('manager'), manager.put)
  .delete(authMiddleware.authorize('admin', 'manager'), manager.drop)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Category */
privateRouter
  .route('/categories')
  .post(authMiddleware.authorize('admin'), category.post)
  .all(handler.method(['POST']));

privateRouter
  .route('/categories/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(category.patch)
  .delete(category.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Subdistrict */
privateRouter
  .route('/subdistricts')
  .post(authMiddleware.authorize('admin'), subdistrict.post)
  .all(handler.method(['POST']));

privateRouter
  .route('/subdistricts/:slug')
  .all(authMiddleware.authorize('admin'))
  .put(subdistrict.patch)
  .delete(subdistrict.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Destination */
privateRouter
  .route('/destinations')
  .post(authMiddleware.authorize('manager'), destination.post)
  .all(handler.method(['POST']));

privateRouter
  .route('/destinations/:slug')
  .all(authMiddleware.authorize('manager'))
  .put(destination.patch)
  .delete(destination.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Attraction */
privateRouter
  .route('/destinations/:slug/attractions')
  .post(authMiddleware.authorize('manager'), attraction.create)
  .all(handler.method(['POST']));

privateRouter
  .route('/destinations/:destinations/attractions/:attractions')
  .all(authMiddleware.authorize('manager'))
  .put(attraction.patch)
  .delete(attraction.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Media Upload */

/** Admin - photo */
privateRouter
  .route('/admins/:id/media')
  .all(authMiddleware.authorize('admin', 'manager'))
  .post(uploadMedia.profileAdmin, media.admin.addProfile)
  .all(handler.method(['POST']));

/** Destinasi - profilePhoto, headlinePhoto */
privateRouter
  .route('/destinations/:slug/media')
  .all(authMiddleware.authorize('manager'))
  .post(uploadMedia.destination.updateMedia, media.destination.updateMedia)
  // .get(media.destination)
  .all(handler.method(['POST']));

/** Destinasi - galleryPhoto */
privateRouter
  .route('/destinations/:slug/gallery')
  .all(authMiddleware.authorize('manager'))
  // .post(media.destination.gallery.add)
  // .get(media.destination.gallery.list)
  // .delete(media.destination.gallery.deleteAll)
  .all(handler.method(['POST', 'GET', 'DELETE']));

privateRouter
  .route('/destinations/:slug/gallery/:id')
  .all(authMiddleware.authorize('manager'))
  // .get(media.destination.gallery.get)
  // .put(media.destination.gallery.update)
  // .delete(media.destination.gallery.delete)
  .all(handler.method(['PUT', 'GET', 'DELETE']));

/** Destinasi - facility - photo */
privateRouter
  .route('/destinations/:destinations/facility/:facility/media')
  .all(authMiddleware.authorize('manager'))
  // .post(media.facility.add)
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
