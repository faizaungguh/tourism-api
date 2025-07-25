import express from 'express';
import * as admin from '#controllers/admin.mjs';
import * as manager from '#controllers/manager.mjs';
import * as category from '#controllers/category.mjs';
import * as subdistrict from '#controllers/subdistrict.mjs';
import * as destination from '#controllers/destination.mjs';
import * as attraction from '#controllers/attraction.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', admin.post);
privateRouter.get('/admins', admin.list);
privateRouter.get('/admins/:id', admin.get);
privateRouter.put('/admins/:id', admin.patch);
privateRouter.delete('/admins/:id', admin.drop);

/** Manager */
privateRouter.get('/managers/:id', manager.get);
privateRouter.put('/managers/:id', manager.put);
privateRouter.delete('/managers/:id', manager.drop);

/** Category */
privateRouter.post('/categories', category.post);
privateRouter.put('/categories', category.patch);
privateRouter.delete('/categories', category.drop);

/** Subdistrict */
privateRouter.post('/subdistricts', subdistrict.post);
privateRouter.put('/subdistricts', subdistrict.patch);
privateRouter.delete('/subdistricts', subdistrict.drop);

/** Destination */
privateRouter.post('/destinations', destination.post);
privateRouter.put('/destinations/:destinationSlug', destination.patch);
privateRouter.delete('/destinations/:destinationSlug', destination.drop);

/** Attraction */
privateRouter.post(
  '/destinations/:destinationSlug/attractions',
  attraction.create
);
privateRouter.put(
  '/destinations/:destinationSlug/attractions/:attractionSlug',
  attraction.patch
);
privateRouter.delete(
  '/destinations/:destinationSlug/attractions/:attractionSlug',
  attraction.drop
);
