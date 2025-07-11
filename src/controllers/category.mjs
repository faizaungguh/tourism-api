import * as categoryService from '../services/category.mjs';

export const postCategory = async (req, res) => {
  const result = await categoryService.createCategory(req.body);
  res.status(201).json({
    message: 'Kategori berhasil dibuat',
    data: result,
  });
};
