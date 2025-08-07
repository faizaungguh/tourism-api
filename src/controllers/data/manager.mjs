import { managerService } from '#services/data/manager.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const manager = {
  list: async (req, res) => {
    const { result, pagination } = await managerService.getAll(req.query);
    res.status(200).json({
      message: 'Menampilkan daftar Manajer',
      data: result,
      pagination,
    });
  },

  get: async (req, res) => {
    const { id } = req.params;
    const admin = req.admin;

    if (admin.role === 'manager' && admin.adminId !== id) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Manager hanya dapat melihat datanya sendiri.',
      });
    }

    const result = await managerService.getDetail(id);
    res.status(200).json({
      message: `Menampilkan Detail Manager '${result.name}'`,
      data: result,
    });
  },

  update: async (req, res) => {
    const { id } = req.params;
    const admin = req.admin;

    if (admin.role === 'manager' && admin.adminId !== id) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Anda tidak diizinkan mengubah data manajer lain.',
      });
    }

    const result = await managerService.update(id, admin, req.body);
    res.status(200).json({
      message: `Data manajer '${result.name}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { id } = req.params;
    const admin = req.admin;

    if (admin.role === 'manager' && admin.adminId !== id) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Anda tidak diizinkan menghapus data manajer lain.',
      });
    }

    const result = await managerService.drop(id);
    res.clearCookie('accessToken', { path: '/' });
    res.status(200).json({
      message: `Manajer '${result.name}' telah berhasil dihapus`,
    });
  },
};
