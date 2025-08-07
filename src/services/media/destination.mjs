import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';

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

  patchGallery: async (destinationDoc, oldPhotoId, newPhotoData) => {
    const photoIndex = destinationDoc.galleryPhoto.findIndex((p) => p.photoId === oldPhotoId);

    if (photoIndex === -1) {
      throw new ResponseError(404, 'Foto lama tidak ditemukan di database untuk diperbarui.');
    }

    destinationDoc.galleryPhoto.set(photoIndex, newPhotoData);

    return destinationDoc.save();
  },

  dropAllGallery: async (destinationDoc) => {
    if (!destinationDoc) {
      throw new ResponseError(400, 'Dokumen tidak ada', {
        message: 'Sertakan dokumen terbaru yang anda perlukan.',
      });
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

  dropOneGallery: async (destinationDoc, photoId) => {
    const photo = destinationDoc.galleryPhoto.find((p) => p.photoId === photoId);

    if (!photo) {
      throw new ResponseError(404, 'Foto dengan ID tersebut tidak ditemukan di galeri ini.');
    }

    const photoUrl = photo.url;

    destinationDoc.galleryPhoto.pull(photo._id);

    await destinationDoc.save();

    if (photoUrl) {
      const rootDir = process.cwd();
      const correctedPath = photoUrl.startsWith('/') ? photoUrl.substring(1) : photoUrl;
      const absolutePath = path.join(rootDir, 'public', correctedPath);
      try {
        await fs.unlink(absolutePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(
            `Gagal menghapus file fisik setelah penghapusan dari DB: ${absolutePath}`,
            err
          );
        }
      }
    }
  },
};
