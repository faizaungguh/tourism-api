import { categoryService } from '#services/category.mjs';

export const category = {
  post: async (req, res) => {
    const result = await categoryService.createCategory(req.body);
    res.status(201).json({
      message: 'Kategori berhasil dibuat',
      data: result,
    });
  },

  get: async (req, res) => {
    const { result, pagination } = await categoryService.getAllCategory(
      req.query
    );
    res.status(200).json({
      message: 'Menampilkan List Kategori',
      result,
      pagination,
    });
  },

  patch: async (req, res) => {
    const { id: id } = req.query;
    const result = await categoryService.updateCategory(id, req.body);
    res.status(200).json({
      message: 'Kategori berhasil diubah',
      data: result,
    });
  },

  drop: async (req, res) => {
    const { id: id } = req.query;
    await categoryService.deleteCategory(id);
    res.status(200).json({
      message: 'Kategori berhasil dihapus',
    });
  },
};
