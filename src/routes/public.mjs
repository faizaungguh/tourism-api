import express from 'express';
import { auth } from '#controllers/auth.mjs';
import { category } from '#controllers/category.mjs';
import { subdistrict } from '#controllers/subdistrict.mjs';
import { destination } from '#controllers/destination.mjs';
import { shield } from '#configs/security.mjs';
import { handler } from '#middlewares/error.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter
  .route('/signup')
  .post(shield.authLimiter, auth.register)
  .all(handler.method(['POST']));

publicRouter
  .route('/signin')
  .post(shield.authLimiter, auth.signin)
  .all(handler.method(['POST']));

/** Category */
publicRouter
  .route('/categories')
  .get(category.get)
  .all(handler.method(['GET']));

/** Subdistricts */
publicRouter
  .route('/subdistricts')
  .get(subdistrict.get)
  .all(handler.method(['GET']));

/** Destination */
publicRouter
  .route('/destinations/category/:categorySlug/:destinationSlug')
  .get(destination.detailCategory)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/category/:categorySlug')
  .get(destination.slugCategory)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/subdistrict/:subdistrictSlug/:destinationSlug')
  .get(destination.detailSubdistrict)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/subdistrict/:subdistrictSlug')
  .get(destination.slugSubdistrict)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations/details/:destinationSlug')
  .get(destination.detail)
  .all(handler.method(['GET']));

publicRouter
  .route('/destinations')
  .get(destination.list)
  .all(handler.method(['GET']));

/** Recommendation */
// publicRouter.route('/destinations/recommendations')
