import * as adminService from '../services/admin.mjs';

export const addAdmin = async (req, res, next) => {
  try {
    const result = await adminService.createAdmin(req.body);
    res.status(201).json({
      message: 'Admin berhasil dibuat',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdmin = async (req, res, next) => {
  try {
    const result = await adminService.getAllAdmin(req.query);
    res.status(200).json({
      message: 'Menampilkan List Data Admin',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
