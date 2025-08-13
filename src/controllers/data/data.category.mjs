import { dataService } from '#services/data/index.mjs';

export const categoryData = {
  post: async (req, res) => {
    const result = await dataService.category.add(req.body);
    res.status(201).json({
      message: 'Kategori berhasil dibuat',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await dataService.category.list(req.query);
    res.status(200).json({
      message: 'Menampilkan List Kategori',
      result,
      pagination,
    });
  },

  update: async (req, res) => {
    const { slug } = req.params;
    const result = await dataService.category.update(slug, req.body);
    res.status(200).json({
      message: 'Kategori berhasil diubah',
      data: result,
    });
  },

  drop: async (req, res) => {
    const { slug } = req.params;
    await dataService.category.delete(slug);
    res.status(200).json({
      message: `Kategori '${slug}' berhasil dihapus`,
    });
  },
};
