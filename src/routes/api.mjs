import express from 'express';
import * as admin from '../controllers/admin.mjs';
import * as manager from '../controllers/manager.mjs';
import * as category from '../controllers/category.mjs';
import * as subdistrict from '../controllers/subdistrict.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', admin.postAdmin);
privateRouter.get('/admins', admin.getAdmin);
privateRouter.put('/admins', admin.patchAdmin);
privateRouter.delete('/admins', admin.dropAdmin);

/** Manager */
privateRouter.get('/managers', manager.getManager);
privateRouter.put('/managers', manager.putManager);
privateRouter.delete('/managers', manager.dropManager);

/** Category */
privateRouter.post('/categories', category.postCategory);
privateRouter.put('/categories', category.patchCategory);
privateRouter.delete('/categories', category.dropCategory);

/** Subdistrict */
privateRouter.post('/subdistricts', subdistrict.postSubdistrict);
privateRouter.put('/subdistricts', subdistrict.patchSubdistrict);
privateRouter.delete('/subdistricts', subdistrict.dropSubdistrict);

/** Destination */
// privateRouter.post('/destinations');
// privateRouter.put('/destinations');
// privateRouter.delete('/destinations');

/** Attraction */
// privateRouter.post('/attractions');
// privateRouter.put('/attractions');
// privateRouter.delete('/attractions');
