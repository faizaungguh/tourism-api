import { dataService } from '#services/index.mjs';

export const attractionData = {
  post: async (req, res) => {
    const adminId = req.admin.adminId;
    const request = req.body;
    const slug = req.params.slug;
    const result = await dataService.attraction.add(adminId, slug, request);

    res.status(201).json({
      message: `Wahana Wisata '${result.name}' berhasil ditambahkan ke destinasi`,
      data: result,
    });
  },

  update: async (req, res) => {
    const adminId = req.admin.adminId;
    const destinationSlug = req.params.destinations;
    const attractionSlug = req.params.attractions;
    const request = req.body;
    const result = await dataService.attraction.update(
      adminId,
      destinationSlug,
      attractionSlug,
      request,
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
    const result = await dataService.attraction.delete(adminId, destinationSlug, attractionSlug);

    res.status(200).json({
      message: `Wahana Wisata '${result.name}' berhasil dihapus dari destinasi`,
    });
  },
};
