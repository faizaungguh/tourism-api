import express from 'express';
import { auth } from '#controllers/auth.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { shield } from '#configs/security.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter.post('/signup', auth.register);
publicRouter.post('/signin', shield.authLimiter, auth.signin);

/** Category */
publicRouter.get('/categories', category.get);

/** Subdistricts */
publicRouter.get('/subdistricts', subdistrict.get);

/** Destination */
publicRouter
  .get(
    '/destinations/category/:categorySlug/:destinationSlug',
    destination.slug
  )
  .get('/destinations/category/:categorySlug', destination.slugCategory)
  .get('/destinations/:destinationSlug', destination.detail)
  .get('/destinations', destination.list);

/** Recommendation */
// publicRouter.get('/destinations/recommendations');
