import path from 'path';
import fs from 'fs/promises';

async function deleteOldFile(oldPath) {
  if (!oldPath) return;
  try {
    const rootDir = process.cwd();
    const correctedOldPath = oldPath.startsWith('/') ? oldPath.substring(1) : oldPath;
    const absoluteOldPath = path.join(rootDir, 'public', correctedOldPath);
    await fs.unlink(absoluteOldPath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Gagal menghapus file lama:', err);
    }
  }
}

export const destinationService = {
  photoMedia: async (destinationDoc, newPhotos) => {
    const { profilePhoto, headlinePhoto } = newPhotos;

    const oldProfilePhoto = destinationDoc.profilePhoto;
    const oldHeadlinePhoto = destinationDoc.headlinePhoto;

    if (profilePhoto) {
      destinationDoc.profilePhoto = profilePhoto;
    }
    if (headlinePhoto) {
      destinationDoc.headlinePhoto = headlinePhoto;
    }

    const updatedDestination = await destinationDoc.save();

    if (profilePhoto) {
      await deleteOldFile(oldProfilePhoto);
    }
    if (headlinePhoto) {
      await deleteOldFile(oldHeadlinePhoto);
    }

    return updatedDestination;
  },

  addGallery: async () => {},

  patchGallery: async () => {},

  dropGallery: async () => {},
};
