import fs from 'fs/promises';
import path from 'path';
import { ResponseError } from '#errors/responseError.mjs';
import { mediaService } from '#services/index.mjs';

export const adminMedia = {
  profileMedia: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { adminId } = req.admin;

      if (adminId !== id) {
        throw new ResponseError(403, 'Akses ditolak.', {
          message: 'Anda hanya dapat mengubah foto profil sendiri.',
        });
      }

      const newPhotoPath = req.processedFiles?.photo;
      if (!newPhotoPath) {
        throw new ResponseError(422, 'Proses dihentikan', {
          photo: 'Anda harus menyertakan dokumen gambar',
        });
      }

      await mediaService.admin.updatePhoto(req.foundAdmin, newPhotoPath);

      res.status(200).json({
        message: `Foto profil untuk ${id} berhasil diperbarui.`,
      });
    } catch (error) {
      if (req.processedFiles?.photo) {
        fs.unlink(path.join('public', req.processedFiles.photo)).catch((err) =>
          console.error(`Gagal membersihkan file: ${req.processedFiles.photo}`, err),
        );
      }
      next(error);
    }
  },

  getProfileMedia: async (req, res, next) => {
    try {
      const adminDoc = req.foundAdmin;

      const photoPath = await mediaService.admin.getProfilePhoto(adminDoc);

      const rootDir = process.cwd();
      const correctedPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
      const absolutePath = path.join(rootDir, 'public', correctedPath);

      res.sendFile(absolutePath, (err) => {
        if (err) {
          next(
            new ResponseError(404, 'Data tidak ditemukan', {
              message: 'Dokumen gambar tidak ditemukan di server.',
            }),
          );
        }
      });
    } catch (error) {
      next(error);
    }
  },
};
