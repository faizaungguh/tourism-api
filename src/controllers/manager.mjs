import { managerService } from '#services/manager.mjs';

export const manager = {
  get: async (req, res) => {
    const { id } = req.params;
    const result = await managerService.getDetail(id);
    res.status(200).json({
      message: `Menampilkan Detail Manager '${result.name}'`,
      data: result,
    });
  },

  put: async (req, res) => {
    const { id } = req.params;
    const { adminId } = req.body;
    const result = await managerService.update(id, adminId, req.body);
    res.status(200).json({
      message: `Data manajer '${result.name}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { id: adminId } = req.params;
    const result = await managerService.drop(adminId);
    res.status(200).json({
      message: `Manajer '${result.name}' telah berhasil dihapus`,
    });
  },
};
