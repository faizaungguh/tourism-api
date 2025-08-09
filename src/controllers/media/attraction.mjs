import { mediaService } from '#services/media.mjs';

const API_URL = process.env.APP_URL || 'http://localhost:3000';

export const attraction = {
  add: async (req, res, next) => {
    try {
      const { foundDestination, foundAttraction, processedPhotos } = req;

      const result = await mediaService.destination.attraction.add(
        foundDestination,
        foundAttraction,
        processedPhotos
      );

      const formattedResult = result.map((photo) => ({
        url: `${API_URL}${photo.url}`,
        photoId: photo.photoId,
        caption: photo.caption,
      }));

      res.status(201).json({
        message: `${result.length} foto berhasil ditambahkan ke wahana.`,
        data: formattedResult,
      });
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const rawPhotos = await mediaService.destination.attraction.list(req.foundAttraction);

      const formattedPhotos = rawPhotos.map((photo) => ({
        url: `${API_URL}${photo.url}`,
        photoId: photo.photoId,
        caption: photo.caption,
      }));

      let message = `Berhasil mengambil ${formattedPhotos.length} foto.`;
      if (formattedPhotos.length === 0) {
        message = 'Tidak ada foto yang tersedia untuk wahana ini.';
      }

      res.status(200).json({
        message,
        data: formattedPhotos,
      });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { foundAttraction, photoToUpdate, newPhotoData } = req;

      const result = await mediaService.destination.attraction.update(
        foundAttraction._id,
        photoToUpdate.photoId,
        newPhotoData
      );

      res.status(200).json({
        status: 'success',
        message: 'Foto wahana berhasil diperbarui.',
        data: {
          url: `${API_URL}${result.url}`,
          photoId: result.photoId,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  dropAll: async (req, res, next) => {
    try {
      const { foundDestination, foundAttraction } = req;

      await mediaService.destination.attraction.deleteAll(foundDestination, foundAttraction);

      res.status(200).json({
        message: `Semua foto untuk wahana "${foundAttraction.name}" telah berhasil dihapus.`,
      });
    } catch (error) {
      next(error);
    }
  },

  dropOne: async (req, res, next) => {
    try {
      const { foundAttraction, photoToDelete } = req;

      await mediaService.destination.attraction.delete(foundAttraction, photoToDelete);

      res.status(200).json({
        message: `Foto dengan ID "${photoToDelete.photoId}" dari wahana "${foundAttraction.name}" telah berhasil dihapus.`,
      });
    } catch (error) {
      next(error);
    }
  },
};
