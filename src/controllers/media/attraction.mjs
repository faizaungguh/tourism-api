import { mediaService } from '#services/media.mjs';
import { attraction as attractionHelper } from '#helpers/media/attraction.mjs';

const API_URL = process.env.APP_URL || 'http://localhost:3000';

export const attraction = {
  add: async (req, res, next) => {
    try {
      const { foundAttraction, processedPhotos } = req;
      const result = await mediaService.destination.attraction.add(
        foundAttraction,
        processedPhotos
      );

      const formattedResult = result.map((photo) => ({
        ...photo,
        url: `${API_URL}${photo.url}`,
      }));

      res.status(201).json({
        message: `${result.length} foto berhasil ditambahkan ke wahana.`,
        data: formattedResult,
      });
    } catch (error) {
      if (req.processedPhotos) {
        for (const photo of req.processedPhotos) {
          await attractionHelper.cleanupFile(photo.url);
        }
      }
      next(error);
    }
  },

  list: async (req, res, next) => {},

  update: async (req, res, next) => {},

  dropAll: async (req, res, next) => {},

  dropOne: async (req, res, next) => {},
};
