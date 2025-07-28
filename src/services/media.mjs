import path from 'path';
import fs from 'fs/promises';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const mediaService = {
  addAdminProfile: async (id, file) => {
    const admin = await Admin.findOne({ adminId: id });
    if (!admin) {
      throw new ResponseError(404, 'Admin tidak ditemukan.');
    }

    if (!file) {
      throw new ResponseError(422, 'Data tidak diproses', {
        message: 'Pastikan Anda mengunggah file gambar.',
      });
    }

    const oldPhotoPath = admin.photo;

    const newRelativePath = path.relative('public', file.path).replace(/\\/g, '/');
    admin.photo = newRelativePath;

    await admin.save();

    if (oldPhotoPath) {
      try {
        const fullOldPath = path.join('public', oldPhotoPath);
        await fs.unlink(fullOldPath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Gagal menghapus foto profil lama:', err);
        }
      }
    }

    return newRelativePath;
  },
};
