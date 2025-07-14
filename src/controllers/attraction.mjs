import * as attractionService from '#services/attraction.mjs';

export const create = async (req, res) => {
  const { adminId } = req.query;
  const { destinationSlug } = req.params;
  const result = await attractionService.create(
    adminId,
    destinationSlug,
    req.body
  );

  res.status(201).json({
    message: `Wahana Wisata '${result.name}' berhasil ditambahkan ke destinasi`,
    data: result,
  });
};
