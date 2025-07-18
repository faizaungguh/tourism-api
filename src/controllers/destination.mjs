import { destinationService } from '#services/destination.mjs';

export const destination = {
  post: async (req, res) => {
    const adminId = req.admin.adminId;
    const request = req.body;

    const result = await destinationService.create(adminId, request);
    res.status(201).json({
      message: 'Tempat Wisata baru berhasil ditambahkan',
      data: result,
    });
  },

  list: async (req, res) => {
    const { result, pagination } = await destinationService.getAll(req.query);

    const message =
      pagination.totalItems > 0
        ? 'Menampilkan List Data Destinasi'
        : 'Data tidak ditemukan';

    res.status(200).json({
      message,
      result,
      pagination,
    });
  },

  detail: async (req, res) => {
    const { destinationSlug } = req.params;
    const result = await destinationService.getDetail(destinationSlug);
    res.status(200).json({
      message: `Menampilkan Detail ${result.destinationTitle}`,
      data: result,
    });
  },

  slugCategory: async (req, res) => {
    const { categorySlug } = req.params;

    const query = {
      ...req.query,
      category: categorySlug,
    };

    const { result, pagination } = await destinationService.getAll(query);

    const message =
      pagination.totalItems > 0
        ? `Menampilkan destinasi '${result[0].category}'`
        : `Tidak ditemukan kategori ${categorySlug}`;

    res.status(200).json({ message, result, pagination });
  },

  slug: async (req, res) => {
    const { categorySlug, destinationSlug } = req.params;
    const result = await destinationService.getDetailSlug(
      categorySlug,
      destinationSlug
    );
    res.status(200).json({
      message: `Menampilkan Detail Wisata dari ${result.destinationTitle}`,
      data: result,
    });
  },

  patch: async (req, res) => {
    const { destinationSlug } = req.params;
    const { adminId } = req.query;
    const result = await destinationService.update(
      destinationSlug,
      adminId,
      req.body
    );
    res.status(200).json({
      message: `Destinasi '${result.destinationTitle}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { destinationSlug } = req.params;
    const { adminId } = req.query;
    const result = await destinationService.drop(destinationSlug, adminId);
    res.status(200).json(result);
  },
};
