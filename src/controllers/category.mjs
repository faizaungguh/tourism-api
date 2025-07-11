import * as categoryService from '../services/category.mjs';

export const postCategory = async (req, res) => {
  const result = await categoryService.createCategory(req.body);
  res.status(201).json({
    message: 'Kategori berhasil dibuat',
    data: result,
  });
};

export const getCategory = async (req, res) => {
  const result = await categoryService.getAllCategory(req.query);
  res.status(200).json({
    message: 'Menampilkan List Kategori',
    data: result,
  });
};

export const patchCategory = async (req, res) => {
  const { id: id } = req.query;
  const result = await categoryService.updateCategory(id, req.body);
  res.status(200).json({
    message: 'Kategori berhasil diubah',
    data: result,
  });
};

export const dropCategory = async (req, res) => {
  const { id: id } = req.query;
  await categoryService.deleteCategory(id);
  res.status(200).json({
    message: 'Kategori berhasil dihapus',
  });
};
