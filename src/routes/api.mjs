import express from 'express';
import { addAdmin, getAdmin } from '../controllers/admin.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', addAdmin);
privateRouter.get('/admins', getAdmin);
