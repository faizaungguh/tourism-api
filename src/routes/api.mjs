import express from 'express';
import { addAdmin, listAdmin } from '../controllers/admin.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', addAdmin);
privateRouter.get('/admins', listAdmin);
