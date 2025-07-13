import * as subdisctrictService from '#services/subdistrict.mjs';

export const postSubdistrict = async (req, res) => {
  const result = await subdisctrictService.createSubdistrict(req.body);
  res.status(201).json({
    message: 'Kecamatan berhasil dibuat',
    data: result,
  });
};

export const getSubdistrict = async (req, res) => {
  const { result, pagination } = await subdisctrictService.getAllSubdistrict(
    req.query
  );
  res.status(200).json({
    message: 'Menampilkan List Kecamatan',
    result,
    pagination,
  });
};

export const patchSubdistrict = async (req, res) => {
  const { id: id } = req.query;
  const result = await subdisctrictService.updateSubdistrict(id, req.body);
  res.status(200).json({
    message: 'Kecamatan berhasil diubah',
    data: result,
  });
};

export const dropSubdistrict = async (req, res) => {
  const { id: id } = req.query;
  await subdisctrictService.deleteSubdistrict(id);
  res.status(200).json({
    message: 'Kategori berhasil dihapus',
  });
};
