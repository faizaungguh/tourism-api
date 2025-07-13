import * as managerService from '#services/manager.mjs';

export const get = async (req, res) => {
  const id = req.query.id;
  const result = await managerService.getDetailManager(id);
  res.status(200).json({
    message: 'Menampilkan Detail Manager',
    data: result,
  });
};

export const put = async (req, res) => {
  const { id: id } = req.query;
  const result = await managerService.updateManager(id, req.body);
  res.status(200).json({
    message: 'Manajer berhasil diubah',
    data: result,
  });
};

export const drop = async (req, res) => {
  const { id: id } = req.query;
  await managerService.deleteManager(id);
  res.status(200).json({
    message: 'Manajer berhasil dihapus',
  });
};
