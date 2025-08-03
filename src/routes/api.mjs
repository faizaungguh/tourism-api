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
privateRouter
  .route('/admins/:id/media')
  .all(authMiddleware.authorize('admin', 'manager'))
  .put(uploadMedia.profileAdmin, media.adminPhoto)
  .all(handler.method(['PUT']));

privateRouter
  .route('/destinations/:destinations/attractions/:attractions/media')
  .all(authMiddleware.authorize('manager'))
  // .put(uploadMedia.attractionPhoto, media.addAttraction)
  .all(handler.method(['PUT']));

privateRouter
  .route('/destinations/:destinations/attractions/:attractions/media/:id')
  .all(authMiddleware.authorize('manager'))
  // .delete(media.dropAttractionPhoto)
  .all(handler.method(['DELETE']));
