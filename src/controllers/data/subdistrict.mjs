import { subdistrictService } from '#services/subdistrict.mjs';

export const subdistrict = {
  post: async (req, res) => {
    const result = await subdistrictService.createSubdistrict(req.body);
    res.status(201).json({
      message: 'Kecamatan berhasil dibuat',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await subdistrictService.getAllSubdistrict(req.query);
    res.status(200).json({
      message: 'Menampilkan List Kecamatan',
      result,
      pagination,
    });
  },

  update: async (req, res) => {
    const { slug } = req.params;
    const result = await subdistrictService.updateSubdistrict(slug, req.body);
    res.status(200).json({
      message: 'Kecamatan berhasil diubah',
      data: result,
    });
  },

  drop: async (req, res) => {
    const { slug } = req.params;
    await subdistrictService.deleteSubdistrict(slug);
    res.status(200).json({
      message: `Kecamatan ${slug} berhasil dihapus`,
    });
  },
};
