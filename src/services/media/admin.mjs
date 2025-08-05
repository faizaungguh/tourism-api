import path from 'path';
import fs from 'fs/promises';

export const admin = {
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
};
