import { adminService } from '#services/admin.mjs';

export const admin = {
  post: async (req, res) => {
    const result = await adminService.create(req.body);
    res.status(201).json({
      message: 'Admin berhasil dibuat',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await adminService.getAll(req.query);
    res.status(200).json({
      message: `'Menampilkan List Data Admin'`,
      result,
      pagination,
    });
  },

  get: async (req, res) => {
    const { id } = req.params;
    const result = await adminService.getDetail(id);
    res.status(200).json({
      message: `Menampilkan detail admin '${result.name}'`,
      data: result,
    });
  },

  patch: async (req, res) => {
    const { id } = req.params;
    const result = await adminService.update(id, req.body);
    res.status(200).json({
      message: `Data admin '${result.name}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { id } = req.params;
    const adminId = req.admin.adminId;
    const result = await adminService.drop(id);
    if (adminId === id) {
      res.clearCookie('accessToken', { path: '/' });
    }
    res.status(200).json({
      message: `Admin '${result.name}' telah berhasil dihapus`,
    });
  },
};
