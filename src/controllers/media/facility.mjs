import { config } from '#configs/variable.mjs';
import { mediaService } from '#services/media.mjs';

const API_URL = config.APP_URL || 'http://localhost:3000';

export const facility = {
  add: async (req, res, next) => {
    try {
      const rawPhotos = await mediaService.destination.facility.add(req);

      const formattedPhotos = rawPhotos.map((photo) => ({
        url: `${API_URL}${photo.url}`,
        photoId: photo.photoId,
        caption: photo.caption,
      }));

      res.status(201).json({
        message: `${rawPhotos.length} foto berhasil ditambahkan.`,
        data: formattedPhotos,
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

  update: async (req, res, next) => {
    try {
      const { foundDestination, foundFacility, newPhotoData, photoToUpdate } = req;

      const result = await mediaService.destination.facility.update(
        foundDestination._id,
        foundFacility.slug,
        photoToUpdate.photoId,
        newPhotoData
      );

      const formattedResult = {
        url: `${API_URL}${result.url}`,
        photoId: result.photoId,
      };

      res.status(200).json({
        message: 'Foto fasilitas berhasil diperbarui.',
        data: formattedResult,
      });
    } catch (error) {
      next(error);
    }
  },

  dropAll: async (req, res, next) => {
    try {
      const { foundDestination, foundFacility } = req;
      await mediaService.destination.facility.deleteAll(foundDestination, foundFacility);

      res.status(200).json({
        message: `Semua foto untuk fasilitas "${foundFacility.name}" telah berhasil dihapus.`,
      });
    } catch (error) {
      next(error);
    }
  },

  dropOne: async (req, res, next) => {
    try {
      const { foundDestination, foundFacility, photoToDelete } = req;

      await mediaService.destination.facility.delete(
        foundDestination,
        foundFacility,
        photoToDelete
      );

      res.status(200).json({
        message: `Foto dengan ID "${photoToDelete.photoId}" telah berhasil dihapus.`,
      });
    } catch (error) {
      next(error);
    }
  },
};
