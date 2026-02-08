import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';

export const adminMedia = {
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

  getProfilePhoto: async (adminDoc) => {
    if (!adminDoc || !adminDoc.photo) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: 'Foto profil untuk pengguna ini tidak ditemukan.',
      });
    }

    return adminDoc.photo;
  },
};
