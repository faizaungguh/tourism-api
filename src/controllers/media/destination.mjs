import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';
import { mediaService } from '#services/media.mjs';
import { destination as destinationHelper } from '#helpers/media/destination.mjs';

const API_URL = process.env.API_URL || 'http://localhost:3000';

export const destination = {
  photoMedia: async (req, res, next) => {
    const { processedPhotos, foundDestination } = req;
    try {
      if (!processedPhotos || Object.keys(processedPhotos).length === 0) {
        throw new ResponseError(422, 'File tidak ada', {
          photo: 'Anda harus menyertakan setidaknya 1 dokumen gambar',
        });
      }

      await mediaService.destination.updateMedia(foundDestination, processedPhotos);

      res.status(200).json({
        message: 'Foto destinasi berhasil diunggah dan diperbarui.',
      });
    } catch (error) {
      if (processedPhotos) {
        for (const key in processedPhotos) {
          const rootDir = process.cwd();
          const correctedPath = processedPhotos[key].startsWith('/')
            ? processedPhotos[key].substring(1)
            : processedPhotos[key];
          fs.unlink(path.join(rootDir, 'public', correctedPath)).catch((err) =>
            console.error('Gagal membersihkan file:', err)
          );
        }
      }
      next(error);
    }
  },

  gallery: {
    add: async (req, res, next) => {
      try {
        const { foundDestination, processedPhotos } = req;
        const result = await mediaService.destination.gallery.add(
          foundDestination,
          processedPhotos
        );

        res.status(201).json({
          message: `${result.length} foto berhasil ditambahkan ke galeri.`,
          data: result,
        });
      } catch (error) {
        if (req.processedPhotos && req.processedPhotos.length > 0) {
          for (const photo of req.processedPhotos) {
            await destinationHelper.cleanupFile(photo.url);
          }
        }
        next(error);
      }
    },

    get: async (req, res, next) => {
      try {
        const { photoId } = req.params;

        const photoData = await mediaService.destination.gallery.get(req.foundDestination, photoId);

        const rootDir = process.cwd();
        const correctedPath = photoData.url.startsWith('/')
          ? photoData.url.substring(1)
          : photoData.url;
        const absolutePath = path.join(rootDir, 'public', correctedPath);

        res.sendFile(absolutePath, (err) => {
          if (err) {
            next(new ResponseError(404, 'File gambar fisik tidak ditemukan di server.'));
          }
        });
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      const { oldPhotoId, newPhotoData } = req.processedPhotoUpdate || {};

      try {
        if (!oldPhotoId || !newPhotoData) {
          throw new ResponseError(422, 'File tidak ada', {
            photoGallery: 'Data foto yang diproses tidak ditemukan.',
          });
        }

        await mediaService.destination.gallery.update(
          req.foundDestination,
          oldPhotoId,
          newPhotoData
        );

        const responseData = {
          ...newPhotoData,
          url: `${API_URL}${newPhotoData.url}`,
        };

        res.status(200).json({
          message: 'Foto galeri berhasil diperbarui.',
          data: responseData,
        });
      } catch (error) {
        if (newPhotoData && newPhotoData.url) {
          await destinationHelper.cleanupFile(newPhotoData.url);
        }
        next(error);
      }
    },

    dropAll: async (req, res, next) => {
      try {
        const destinationDoc = req.foundDestination;

        await mediaService.destination.gallery.deleteAll(destinationDoc);
        res.status(200).json({
          message: `Semua foto di galeri untuk destinasi "${destinationDoc.destinationTitle}" telah berhasil dihapus.`,
        });
      } catch (error) {
        next(error);
      }
    },

    dropOne: async (req, res, next) => {
      try {
        const { id: photoId } = req.params;
        const destinationDoc = req.foundDestination;

        await mediaService.destination.gallery.delete(destinationDoc, photoId);

        res.status(200).json({
          message: `1 Foto dari galeri ${destinationDoc.destinationTitle} berhasil dihapus.`,
        });
      } catch (error) {
        next(error);
      }
    },
  },
};
