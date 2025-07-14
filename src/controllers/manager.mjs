import * as managerService from '#services/manager.mjs';

export const get = async (req, res) => {
  const { id } = req.params;
  const result = await managerService.getDetail(id);
  res.status(200).json({
    message: `Menampilkan Detail Manager '${result.name}'`,
    data: result,
  });
};

export const put = async (req, res) => {
  const { id } = req.params;
  // Ambil adminId dari body untuk otorisasi (sementara sebelum ada JWT)
  const { adminId } = req.body;
  const result = await managerService.update(id, adminId, req.body);
  res.status(200).json({
    message: `Data manajer '${result.name}' berhasil diubah`,
    data: result,
  });
};

export const drop = async (req, res) => {
  const { id } = req.params;
  // Ambil adminId dari body untuk otorisasi (sementara sebelum ada JWT)
  const { adminId } = req.body;
  const result = await managerService.drop(id, adminId);
  res.status(200).json({
    message: `Manajer '${result.name}' telah berhasil dihapus`,
  });
};
