import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';
import { mediaService } from '#services/media.mjs';

export const media = {
  addAdminProfile: async (req, res, next) => {
    try {
      const { adminId } = req.admin;
      const { id } = req.params;

      if (adminId !== id) {
        throw new ResponseError(403, 'Akses ditolak.', {
          message: 'Admin dan Manager hanya dapat mengakses data anda sendiri.',
        });
      }

      const photoPath = await mediaService.addAdminProfile(id, req.file);
      res.status(200).json({
        message: `Foto profile ${id} terbaru telah ditambahkan`,
        data: { path: photoPath },
      });
    } catch (error) {
      if (error.status === 429 && req.file?.path) {
        fs.unlink(req.file.path).catch((err) =>
          console.error(`Gagal membersihkan file duplikat: ${req.file.path}`, err)
        );
      }
      next(error);
    }
  },
};
