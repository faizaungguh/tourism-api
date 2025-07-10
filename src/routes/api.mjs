import express from 'express';
import { addAdmin } from '../controllers/admin.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', addAdmin);
