import { mediaService } from '#services/media.mjs';

export const facility = {
  add: async (req, res, next) => {
    try {
      const result = await mediaService.destination.facility.add(req);
      res.status(201).json({
        message: `${result.length} foto berhasil ditambahkan.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const photos = await mediaService.destination.facility.list(req.foundFacility);

      let message = `Berhasil mengambil ${photos.length} foto.`;
      if (photos.length === 0) {
        message = 'Tidak ada foto yang tersedia untuk fasilitas ini.';
      }

      res.status(200).json({
        status: 'success',
        message,
        data: photos,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {},

  dropAll: async (req, res, next) => {},

  dropOne: async (req, res, next) => {},
};
