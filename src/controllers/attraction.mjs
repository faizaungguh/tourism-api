import { attractionService } from '#services/attraction.mjs';

export const attraction = {
  create: async (req, res) => {
    const { adminId } = req.query;
    const slug = req.params['destination-slug'];
    const result = await attractionService.create(adminId, slug, req.body);

    res.status(201).json({
      message: `Wahana Wisata '${result.name}' berhasil ditambahkan ke destinasi`,
      data: result,
    });
  },

  patch: async (req, res) => {
    const { adminId } = req.query;
    const { destinationSlug, attractionSlug } = req.params;
    const result = await attractionService.update(
      adminId,
      destinationSlug,
      attractionSlug,
      req.body
    );

    res.status(200).json({
      message: `Wahana Wisata '${result.name}' berhasil diubah`,
      data: result,
    });
  },

  drop: async (req, res) => {
    const { adminId } = req.query;
    const { destinationSlug, attractionSlug } = req.params;
    const result = await attractionService.drop(
      adminId,
      destinationSlug,
      attractionSlug
    );

    res.status(200).json({
      message: `Wahana Wisata '${result.name}' berhasil dihapus dari destinasi`,
    });
  },
};
