import express from 'express';
import { admin } from '#controllers/admin.mjs';
import { manager } from '#controllers/manager.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { attraction } from '#controllers/attraction.mjs';

export const privateRouter = new express.Router();
/** Admin */
privateRouter
  .post('/admins', admin.post)
  .get('/admins', admin.list)
  .get('/admins/:id', admin.get)
  .put('/admins/:id', admin.patch)
  .delete('/admins/:id', admin.drop);

/** Manager */
privateRouter
  .get('/managers/:id', manager.get)
  .put('/managers/:id', manager.put)
  .delete('/managers/:id', manager.drop);

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
