import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';
import { mediaService } from '#services/media.mjs';

export const destination = {
  photoMedia: async (req, res, next) => {
    const { processedPhotos, foundDestination } = req;
    try {
      if (!processedPhotos || Object.keys(processedPhotos).length === 0) {
        throw new ResponseError(400, 'File tidak ada', {
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

  addDestinationGallery: async (req, res, next) => {
    try {
      await mediaService.destination.gallery.add(req.foundDestination, req.processedGallery);

      res.status(201).json({
        message: `${req.processedGallery.length} foto berhasil ditambahkan ke galeri.`,
        data: req.processedGallery,
      });
    } catch (error) {
      if (req.processedGallery) {
        for (const photo of req.processedGallery) {
          const rootDir = process.cwd();
          const correctedPath = photo.url.startsWith('/') ? photo.url.substring(1) : photo.url;
          fs.unlink(path.join(rootDir, 'public', correctedPath)).catch((err) =>
            console.error('Gagal membersihkan file galeri:', err)
          );
        }
      }
      next(error);
    }
  },

  patchGallery: async () => {},

  dropGallery: async () => {},
};
