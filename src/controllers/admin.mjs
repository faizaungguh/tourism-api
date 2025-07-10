import * as adminService from '../services/admin.mjs';
import { ResponseError } from '../errors/responseError.mjs';

export const addAdmin = async (req, res) => {
  const result = await adminService.createAdmin(req.body);
  res.status(201).json({
    message: 'Admin berhasil dibuat',
    data: result,
  });
};

export const getAdmin = async (req, res) => {
  if (req.query.id) {
    const adminId = req.query.id;
    const result = await adminService.getDetailAdmin(adminId);
    res.status(200).json({
      message: 'Menampilkan Detail Admin',
      data: result,
    });
  } else {
    const result = await adminService.getAllAdmin(req.query);
    res.status(200).json({
      message: 'Menampilkan List Data Admin',
      data: result,
    });
  }
};

export const updateAdmin = async (req, res) => {
  const { id: adminId } = req.query;
  const result = await adminService.updateAdmin(adminId, req.body);
  res.status(200).json({
    message: 'Admin berhasil diubah',
    data: result,
  });
};

export const deleteAdmin = async (req, res) => {
  const { id: adminId } = req.query;
  await adminService.deleteAdmin(adminId);
  res.status(200).json({
    message: 'Admin berhasil dihapus',
  });
};
