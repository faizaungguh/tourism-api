import express from 'express';
import {
  addAdmin,
  getAdmin,
  deleteAdmin,
  updateAdmin,
} from '../controllers/admin.mjs';

export const privateRouter = new express.Router();

/** Admin */
privateRouter.post('/admins', addAdmin);
privateRouter.get('/admins', getAdmin);
privateRouter.put('/admins', updateAdmin);
privateRouter.delete('/admins', deleteAdmin);
