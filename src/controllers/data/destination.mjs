import { dataService } from '#services/data.mjs';

export const destination = {
  post: async (req, res) => {
    const adminId = req.admin.adminId;
    const request = req.body;

    const result = await dataService.destination.add(adminId, request);
    res.status(201).json({
      message: 'Tempat Wisata baru berhasil ditambahkan',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await dataService.destination.list(req.query);

    const message =
      pagination.totalItems > 0 ? 'Menampilkan List Data Destinasi' : 'Data tidak ditemukan';

    res.status(200).json({
      message,
      result,
      pagination,
    });
  },

  detail: async (req, res) => {
    const { slug } = req.params;
    const result = await dataService.destination.detail(slug);
    res.status(200).json({
      message: `Menampilkan Detail ${result.destinationTitle}`,
      data: result,
    });
  },

  update: async (req, res) => {
    const adminId = req.admin.adminId;
    const request = req.body;
    const { slug: destinationSlug } = req.params;
    const result = await dataService.destination.update(destinationSlug, adminId, request);
    res.status(200).json({
      message: `Destinasi '${result.destinationTitle}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { slug: destinationSlug } = req.params;
    const adminId = req.admin.adminId;
    const result = await dataService.destination.delete(destinationSlug, adminId);
    res.status(200).json(result);
  },
};
