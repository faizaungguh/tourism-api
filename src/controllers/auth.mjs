import * as managerService from '../services/manager.mjs';

export const register = async (req, res) => {
  const result = await managerService.registerManager(req.body);
  res.status(201).json({
    message: 'Manager berhasil dibuat',
    data: result,
  });
};

export const signin = async (req, res) => {};

export const signout = async (req, res) => {};
