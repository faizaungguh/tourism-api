import * as adminService from '#services/admin.mjs';

export const post = async (req, res) => {
  const result = await adminService.create(req.body);
  res.status(201).json({
    message: 'Admin berhasil dibuat',
    data: result,
  });
};

export const list = async (req, res) => {
  const { result, pagination } = await adminService.getAll(req.query);
  res.status(200).json({
    message: `'Menampilkan List Data Admin'`,
    result,
    pagination,
  });
};

export const get = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.getDetail(id);
  res.status(200).json({
    message: `Menampilkan detail admin '${result.name}'`,
    data: result,
  });
};

export const patch = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.update(id, req.body);
  res.status(200).json({
    message: `Data admin '${result.name}' berhasil diubah`,
    data: result,
  });
};

export const drop = async (req, res) => {
  const { id } = req.params;
  const result = await adminService.drop(id);
  res.status(200).json({
    message: `Admin '${result.name}' telah berhasil dihapus`,
  });
};
