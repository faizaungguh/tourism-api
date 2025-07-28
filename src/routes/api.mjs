import express from 'express';
import { admin } from '#controllers/admin.mjs';
import { manager } from '#controllers/manager.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { attraction } from '#controllers/attraction.mjs';
import { auth } from '#controllers/auth.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';
import { handler } from '#middlewares/error.mjs';
import { media } from '#controllers/media.mjs';
import { uploadMedia } from '#middlewares/media.mjs';

export const privateRouter = new express.Router();

privateRouter
  .route('/signout')
  .all(authMiddleware.protect, authMiddleware.authorize('admin', 'manager'))
  .delete(auth.signout)
  .all(handler.method(['DELETE']));

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .get(admin.list)
  .post(admin.post)
  .all(handler.method(['GET', 'POST']));

privateRouter
  .route('/admins/:id')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .get(admin.get)
  .put(admin.patch)
  .delete(admin.drop)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Manager */
privateRouter
  .route('/managers/:id')
  .get(authMiddleware.protect, authMiddleware.authorize('admin', 'manager'), manager.get)
  .put(authMiddleware.protect, authMiddleware.authorize('manager'), manager.put)
  .delete(authMiddleware.protect, authMiddleware.authorize('admin', 'manager'), manager.drop)
  .all(handler.method(['GET', 'PUT', 'DELETE']));

/** Category */
privateRouter
  .route('/categories')
  .post(authMiddleware.protect, authMiddleware.authorize('admin'), category.post)
  .all(handler.method(['POST']));

privateRouter
  .route('/categories/:slug')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .put(category.patch)
  .delete(category.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Subdistrict */
privateRouter.post(
  '/subdistricts',
  authMiddleware.protect,
  authMiddleware.authorize('admin'),
  subdistrict.post
);
privateRouter.all('/subdistricts', handler.method(['POST']));

privateRouter
  .route('/subdistricts/:slug')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .put(subdistrict.patch)
  .delete(subdistrict.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Destination */
privateRouter.post(
  '/destinations',
  authMiddleware.protect,
  authMiddleware.authorize('manager'),
  destination.post
);
privateRouter.all('/destinations', handler.method(['POST']));

privateRouter
  .route('/destinations/:slug')
  .all(authMiddleware.protect, authMiddleware.authorize('manager'))
  .put(destination.patch)
  .delete(destination.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Attraction */
privateRouter
  .route('/destinations/:destinations/attractions')
  .post(authMiddleware.protect, authMiddleware.authorize('manager'), attraction.create)
  .all(handler.method(['POST']));

privateRouter
  .route('/destinations/:destinations/attractions/:attractions')
  .all(authMiddleware.protect, authMiddleware.authorize('manager'))
  .put(attraction.patch)
  .delete(attraction.drop)
  .all(handler.method(['PUT', 'DELETE']));

/** Media Upload */
privateRouter
  .route('/admins/:id/photo')
  .all(authMiddleware.protect, authMiddleware.authorize('admin', 'manager'))
  .post(uploadMedia.profileAdmin, media.addAdminProfile);
