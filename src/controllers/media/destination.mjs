import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';
import { destinationService } from '#services/media/destination.mjs';

export const destination = {
  photoMedia: async (req, res, next) => {
    const { processedPhotos, foundDestination } = req;
    try {
      if (!processedPhotos || Object.keys(processedPhotos).length === 0) {
        throw new ResponseError(400, 'File tidak ada', {
          photo: 'Anda harus menyertakan setidaknya 1 dokumen gambar',
        });
      }

      await destinationService.photoMedia(foundDestination, processedPhotos);

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

  addGallery: async () => {},

  patchGallery: async () => {},

  dropGallery: async () => {},
};
