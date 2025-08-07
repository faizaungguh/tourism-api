import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';

const API_URL = process.env.API_URL || 'http://localhost:3000';

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

  addGallery: async (destinationDoc, photosData) => {
    destinationDoc.galleryPhoto.push(...photosData);
    return destinationDoc.save();
  },

  getGalleryPhotoById: async (destinationDoc, photoId) => {
    if (!destinationDoc) {
      throw new ResponseError(404, 'Destinasi tidak ditemukan.');
    }

    if (!destinationDoc.galleryPhoto || destinationDoc.galleryPhoto.length === 0) {
      throw new ResponseError(404, 'Galeri untuk destinasi ini kosong atau tidak ditemukan.');
    }

    const photo = destinationDoc.galleryPhoto.find((p) => p.photoId === photoId);

    if (!photo) {
      throw new ResponseError(404, 'Foto dengan ID tersebut tidak ditemukan di galeri ini.');
    }
    return photo.toObject();
  },
  patchGallery: async () => {},

  dropAllGallery: async (destinationDoc) => {
    if (!destinationDoc) {
      throw new Error('dropAllGallery dipanggil tanpa dokumen destinasi yang valid.');
    }

    if (!destinationDoc.galleryPhoto || destinationDoc.galleryPhoto.length === 0) {
      return;
    }

    const destinationSlug = destinationDoc.slug;
    const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
    const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}/gallery`;
    const galleryPath = path.join(process.cwd(), 'public', 'images', dynamicDir);

    try {
      await fs.rm(galleryPath, { recursive: true, force: true });
    } catch (err) {
      console.error(
        `Gagal menghapus direktori galeri, namun proses akan tetap dilanjutkan: ${galleryPath}`,
        err
      );
    }

    destinationDoc.galleryPhoto = [];

    await destinationDoc.save();
  },
};
