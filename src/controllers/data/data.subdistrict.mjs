import { dataService } from '#services/index.mjs';

export const subdistrictData = {
  post: async (req, res) => {
    const result = await dataService.subdistrict.add(req.body);
    res.status(201).json({
      message: 'Kecamatan berhasil dibuat',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await dataService.subdistrict.list(req.query);
    res.status(200).json({
      message: 'Menampilkan List Kecamatan',
      result,
      pagination,
    });
  },

  update: async (req, res) => {
    const { slug } = req.params;
    const result = await dataService.subdistrict.update(slug, req.body);
    res.status(200).json({
      message: 'Kecamatan berhasil diubah',
      data: result,
    });
  },

  drop: async (req, res) => {
    const { slug } = req.params;
    await dataService.subdistrict.delete(slug);
    res.status(200).json({
      message: `Kecamatan ${slug} berhasil dihapus`,
    });
  },
};
