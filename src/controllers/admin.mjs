import * as adminService from '../services/admin.mjs';

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
