import * as managerService from '../services/manager.mjs';

export const getManager = async (req, res) => {
  const adminId = req.query.id;
  const result = await managerService.getDetailManager(adminId);
  res.status(200).json({
    message: 'Menampilkan Detail Manager',
    data: result,
  });
};

export const putManager = async (req, res) => {};

export const dropManager = async (req, res) => {
  const { id: adminId } = req.query;
  await managerService.deleteManager(adminId);
  res.status(200).json({
    message: 'Manajer berhasil dihapus',
  });
};
