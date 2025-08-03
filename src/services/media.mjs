import path from 'path';
import fs from 'fs/promises';

export const mediaService = {
  updateAdminPhoto: async (admin, newPhotoPath) => {
    const oldPhotoPath = admin.photo;

    admin.photo = newPhotoPath;
    await admin.save();

    if (oldPhotoPath) {
      try {
        await fs.unlink(path.join('public', oldPhotoPath));
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Gagal menghapus foto profil lama:', err);
        }
      }
    }

    return newPhotoPath;
  },

  updateAttractionPhoto: async () => {},
};
