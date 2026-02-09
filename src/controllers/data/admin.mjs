import { dataService } from '#services/index.mjs';

export const adminData = {
  post: async (req, res) => {
    const result = await dataService.admin.add(req.body);
    res.status(201).json({
      message: 'Admin berhasil dibuat',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await dataService.admin.list(req.query);
    res.status(200).json({
      message: `'Menampilkan List Data Admin'`,
      result,
      pagination,
    });
  },

  get: async (req, res) => {
    const { id } = req.params;
    const result = await dataService.admin.detail(id);
    res.status(200).json({
      message: `Menampilkan detail admin '${result.name}'`,
      data: result,
    });
  },

  update: async (req, res) => {
    const { id } = req.params;
    const result = await dataService.admin.update(id, req.body);
    res.status(200).json({
      message: `Data admin '${result.name}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { id } = req.params;
    const adminId = req.admin.adminId;
    const result = await dataService.admin.delete(id);
    if (adminId === id) {
      res.clearCookie('accessToken', { path: '/' });
    }
    res.status(200).json({
      message: `Admin '${result.name}' telah berhasil dihapus`,
    });
  },
};
