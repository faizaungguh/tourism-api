import express from 'express';
import * as admin from '#controllers/admin.mjs';
import * as manager from '#controllers/manager.mjs';
import * as category from '#controllers/category.mjs';
import * as subdistrict from '#controllers/subdistrict.mjs';
import * as destination from '#controllers/destination.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', admin.post);
privateRouter.get('/admins', admin.get);
privateRouter.put('/admins', admin.patch);
privateRouter.delete('/admins', admin.drop);

/** Manager */
privateRouter.get('/managers', manager.get);
privateRouter.put('/managers', manager.put);
privateRouter.delete('/managers', manager.drop);

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
privateRouter.put('/destinations/:id', destination.patch);
privateRouter.delete('/destinations/:id', destination.drop);

/** Attraction */
// privateRouter.post('/attractions');
// privateRouter.put('/attractions');
// privateRouter.delete('/attractions');
