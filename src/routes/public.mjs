import express from 'express';
import { auth } from '#controllers/auth.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter.post('/auth/register', auth.register);
publicRouter.post('/auth/login', auth.signin);
publicRouter.delete('/auth/logout', auth.signout);

/** Category */
publicRouter.get('/categories', category.get);

/** Subdistricts */
publicRouter.get('/subdistricts', subdistrict.get);

/** Destination */
publicRouter
  .get('/destinations/category/:categorySlug', destination.slugCategory)
  .get(
    '/destinations/category/:categorySlug/:destinationSlug',
    destination.slug
  )
  .get('/destinations/:destinationSlug', destination.detail)
  .get('/destinations', destination.list);

/** Recommendation */
// publicRouter.get('/destinations/recommendations');
