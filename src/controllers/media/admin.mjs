import fs from 'fs/promises';
import path from 'path';
import { ResponseError } from '#errors/responseError.mjs';
import { mediaService } from '#services/media.mjs';

export const admin = {
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
        throw new ResponseError(422, 'Dokumen tidak ditemukan', {
          photo: 'Anda harus menyertakan dokumen gambar',
        });
      }

      await mediaService.updateAdminPhoto(req.foundAdmin, newPhotoPath);

      res.status(200).json({
        message: `Foto profil untuk ${id} berhasil diperbarui.`,
      });
    } catch (error) {
      if (req.processedFiles?.photo) {
        fs.unlink(path.join('public', req.processedFiles.photo)).catch((err) =>
          console.error(`Gagal membersihkan file: ${req.processedFiles.photo}`, err)
        );
      }
      next(error);
    }
  },
};
