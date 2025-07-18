import express from 'express';
import { admin } from '#controllers/admin.mjs';
import { manager } from '#controllers/manager.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { attraction } from '#controllers/attraction.mjs';
import { auth } from '#controllers/auth.mjs';
import { authMiddleware } from '#middlewares/auth.mjs';

export const privateRouter = new express.Router();

privateRouter.delete('/signout', auth.signout);

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .post(admin.post)
  .get(admin.list);
privateRouter
  .route('/admins/:id')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .get(admin.get)
  .put(admin.patch)
  .delete(admin.drop);

/** Manager */
privateRouter
  .route('/managers/:id')
  .get(
    authMiddleware.protect,
    authMiddleware.authorize('admin', 'manager'),
    manager.get
  )
  .put(authMiddleware.protect, authMiddleware.authorize('manager'), manager.put)
  .delete(
    authMiddleware.protect,
    authMiddleware.authorize('admin', 'manager'),
    manager.drop
  );

/** Category */
privateRouter
  .route('/categories')
  .post(
    authMiddleware.protect,
    authMiddleware.authorize('admin'),
    category.post
  );
privateRouter
  .route('/categories/:slug')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .put(category.patch)
  .delete(category.drop);

/** Subdistrict */
privateRouter.post(
  '/subdistricts',
  authMiddleware.protect,
  authMiddleware.authorize('admin'),
  subdistrict.post
);
privateRouter
  .route('/subdistricts/:slug')
  .all(authMiddleware.protect, authMiddleware.authorize('admin'))
  .put(subdistrict.patch)
  .delete(subdistrict.drop);

/** Destination */
privateRouter.post(
  '/destinations',
  authMiddleware.protect,
  authMiddleware.authorize('manager'),
  destination.post
);
privateRouter
  .route('/destinations/:slug')
  .all(authMiddleware.protect, authMiddleware.authorize('manager'))
  .put(destination.patch)
  .delete(destination.drop);

/** Attraction */
privateRouter
  .route('/destinations/:destination-slug/attractions')
  .post(attraction.create);
privateRouter
  .route('/destinations/:destination-slug/attractions/:attraction-slug')
  .put(attraction.patch)
  .delete(attraction.drop);
