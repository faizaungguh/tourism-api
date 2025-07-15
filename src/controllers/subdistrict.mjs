import * as subdistrictService from '#services/subdistrict.mjs';

export const post = async (req, res) => {
  const result = await subdistrictService.createSubdistrict(req.body);
  res.status(201).json({
    message: 'Kecamatan berhasil dibuat',
    data: result,
  });
};

export const get = async (req, res) => {
  const { result, pagination } = await subdistrictService.getAllSubdistrict(
    req.query
  );
  res.status(200).json({
    message: 'Menampilkan List Kecamatan',
    result,
    pagination,
  });
};

export const patch = async (req, res) => {
  const { id: id } = req.query;
  const result = await subdistrictService.updateSubdistrict(id, req.body);
  res.status(200).json({
    message: 'Kecamatan berhasil diubah',
    data: result,
  });
};

export const drop = async (req, res) => {
  const { id: id } = req.query;
  await subdistrictService.deleteSubdistrict(id);
  res.status(200).json({
    message: 'Kategori berhasil dihapus',
  });
};
