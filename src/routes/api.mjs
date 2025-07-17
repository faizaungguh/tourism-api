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

privateRouter.delete(
  '/signout',
  authMiddleware.protect('manager', 'admin'),
  auth.signout
);

/** Admin */
privateRouter
  .route('/admins')
  .all(authMiddleware.protect('admin'))
  .post(admin.post)
  .get(admin.list);
privateRouter
  .route('/admins/:id')
  .all(authMiddleware.protect('admin'))
  .get(admin.get)
  .put(admin.patch)
  .delete(admin.drop);

/** Manager */
privateRouter
  .route('/managers/:id')
  .get(authMiddleware.protect('manager', 'admin'), manager.get)
  .put(authMiddleware.protect('manager'), manager.put)
  .delete(authMiddleware.protect('manager', 'admin'), manager.drop);

/** Category */
privateRouter
  .post('/categories', category.post)
  .put('/categories', category.patch)
  .delete('/categories', category.drop);

/** Subdistrict */
privateRouter
  .post('/subdistricts', subdistrict.post)
  .put('/subdistricts', subdistrict.patch)
  .delete('/subdistricts', subdistrict.drop);

/** Destination */
privateRouter
  .post('/destinations', destination.post)
  .put('/destinations/:destinationSlug', destination.patch)
  .delete('/destinations/:destinationSlug', destination.drop);

/** Attraction */
privateRouter
  .post('/destinations/:destinationSlug/attractions', attraction.create)
  .put(
    '/destinations/:destinationSlug/attractions/:attractionSlug',
    attraction.patch
  )
  .delete(
    '/destinations/:destinationSlug/attractions/:attractionSlug',
    attraction.drop
  );
