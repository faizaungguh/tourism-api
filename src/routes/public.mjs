import express from 'express';
import * as auth from '#controllers/auth.mjs';
import * as category from '#controllers/category.mjs';
import * as subdistrict from '#controllers/subdistrict.mjs';
import * as destination from '#controllers/destination.mjs';

export const publicRouter = new express.Router();

/** Auth */
publicRouter.post('/auth/register', auth.register);
// publicRouter.get('/auth/login');
// publicRouter.get('/auth/logout');

/** Category */
publicRouter.get('/categories', category.get);

/** Subdistricts */
publicRouter.get('/subdistricts', subdistrict.get);

/** Destination */
publicRouter.get('/destinations', destination.get);

/** Recommendation */
// publicRouter.get('/destinations/recommendations');
