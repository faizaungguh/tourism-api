import { ResponseError } from '#errors/responseError.mjs';
import { mediaService } from '#services/media.mjs';

export const media = {
  addAdminProfile: async (req, res, next) => {
    const { adminId } = req.admin;
    const { id } = req.params;

    if (adminId !== id) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Admin dan Manager hanya dapat mengakses datanya sendiri.',
      });
    }

    const photoPath = await mediaService.addAdminProfile(id, req.file);
    res.status(200).json({
      message: `Foto profile ${id} terbaru telah ditambahkan`,
      data: { path: photoPath },
    });
  },
};
