import path from 'path';
import fs from 'fs/promises';
import { adminService as mainAdminService } from '#services/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const adminService = {
  profilePhoto: async (admin, newPhotoPath) => {
    const oldPhotoPath = admin.photo;

    admin.photo = newPhotoPath;
    await admin.save();

    if (oldPhotoPath) {
      try {
        const rootDir = process.cwd();

        const correctedOldPath = oldPhotoPath.startsWith('/')
          ? oldPhotoPath.substring(1)
          : oldPhotoPath;

        const absoluteOldPath = path.join(rootDir, 'public', correctedOldPath);

        await fs.unlink(absoluteOldPath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Gagal menghapus foto profil lama:', err);
        }
      }
    }

    return newPhotoPath;
  },

  getProfilePhoto: async (targetId) => {
    const user = await mainAdminService.getDetail(targetId);

    if (!user || !user.photo) {
      throw new ResponseError(404, 'Foto profil untuk pengguna ini tidak ditemukan.');
    }

    return user.photo;
  },
};
