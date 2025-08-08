import { mediaService } from '#services/media.mjs';

const API_URL = process.env.APP_URL || 'http://localhost:3000';

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
      const rawPhotos = await mediaService.destination.facility.list(req.foundFacility);

      const formattedPhotos = rawPhotos.map((photo) => ({
        url: `${API_URL}${photo.url}`,
        photoId: photo.photoId,
        caption: photo.caption,
      }));

      let message = `Berhasil mengambil ${formattedPhotos.length} foto.`;
      if (formattedPhotos.length === 0) {
        message = 'Tidak ada foto yang tersedia untuk fasilitas ini.';
      }

      res.status(200).json({
        message,
        data: formattedPhotos,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {},

  dropAll: async (req, res, next) => {
    try {
      const destinationDoc = req.foundDestination;

      await mediaService.destination.facility.deleteAll(destinationDoc);

      res.status(200).json({
        message: `Semua foto dari galeri destinasi "${destinationDoc.destinationTitle}" telah berhasil dihapus.`,
      });
    } catch (error) {
      next(error);
    }
  },

  dropOne: async (req, res, next) => {},
};
