import { attractionService } from '#services/attraction.mjs';

export const attraction = {
  create: async (req, res) => {
    const adminId = req.admin.adminId;
    const request = req.body;
    const slug = req.params.slug;
    const result = await attractionService.create(adminId, slug, request);

    res.status(201).json({
      message: `Wahana Wisata '${result.name}' berhasil ditambahkan ke destinasi`,
      data: result,
    });
  },

  patch: async (req, res) => {
    const adminId = req.admin.adminId;
    const destinationSlug = req.params.destinations;
    const attractionSlug = req.params.attractions;
    const request = req.body;
    const result = await attractionService.update(
      adminId,
      destinationSlug,
      attractionSlug,
      request
    );

    res.status(200).json({
      message: `Wahana Wisata '${result.name}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const adminId = req.admin.adminId;
    const destinationSlug = req.params.destinations;
    const attractionSlug = req.params.attractions;
    const result = await attractionService.drop(adminId, destinationSlug, attractionSlug);

    res.status(200).json({
      message: `Wahana Wisata '${result.name}' berhasil dihapus dari destinasi`,
    });
  },
};
