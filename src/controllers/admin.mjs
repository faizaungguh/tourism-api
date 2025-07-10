import * as adminService from '../services/admin.mjs';

export const addAdmin = async (req, res, next) => {
  try {
    const result = await adminService.addAdmin(req.body);
    res.status(201).json({
      message: 'Admin berhasil dibuat',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
