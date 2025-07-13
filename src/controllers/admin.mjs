import * as adminService from '#services/admin.mjs';

export const post = async (req, res) => {
  const result = await adminService.createAdmin(req.body);
  res.status(201).json({
    message: 'Admin berhasil dibuat',
    data: result,
  });
};

export const get = async (req, res) => {
  if (req.query.id) {
    const id = req.query.id;
    const result = await adminService.getDetailAdmin(id);
    res.status(200).json({
      message: 'Menampilkan Detail Admin',
      data: result,
    });
  } else {
    const { result, pagination } = await adminService.getAllAdmin(req.query);
    res.status(200).json({
      message: 'Menampilkan List Data Admin',
      result,
      pagination,
    });
  }
};

export const patch = async (req, res) => {
  const { id: id } = req.query;
  const result = await adminService.updateAdmin(id, req.body);
  res.status(200).json({
    message: 'Admin berhasil diubah',
    data: result,
  });
};

export const drop = async (req, res) => {
  const { id: id } = req.query;
  await adminService.deleteAdmin(id);
  res.status(200).json({
    message: 'Admin berhasil dihapus',
  });
};
