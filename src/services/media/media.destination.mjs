import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';

async function deleteOldFile(webPath) {
  if (!webPath) return;
  try {
    const rootDir = process.cwd();
    const correctedPath = webPath.startsWith('/') ? webPath.substring(1) : webPath;
    const absolutePath = path.join(rootDir, 'public', correctedPath);
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Gagal menghapus file lama di ${webPath}:`, err);
    }
  }
}

export const destinationMedia = {
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

  gallery: {
    add: async (destinationDoc, newPhotos) => {
      if (!destinationDoc || !newPhotos) {
        throw new ResponseError(422, 'Proses dihentikan', {
          message: 'Data destinasi atau foto tidak valid saat dikirim ke service.',
        });
      }

      destinationDoc.galleryPhoto.push(...newPhotos);

      await destinationDoc.save();

      return newPhotos;
    },

    list: async (destinationDoc) => {
      return destinationDoc.galleryPhoto || [];
    },

    update: async (destinationDoc, oldPhotoId, newPhotoData) => {
      const photoIndex = destinationDoc.galleryPhoto.findIndex((p) => p.photoId === oldPhotoId);

      if (photoIndex === -1) {
        throw new ResponseError(404, 'File tidak ditemukan', {
          message: 'Foto lama tidak ditemukan di database untuk diperbarui.',
        });
      }

      destinationDoc.galleryPhoto.set(photoIndex, newPhotoData);

      return destinationDoc.save();
    },

    dropAll: async (destinationDoc) => {
      if (!destinationDoc) {
        throw new ResponseError(422, 'Proses dihentikan', {
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
          err,
        );
      }

      destinationDoc.galleryPhoto = [];

      await destinationDoc.save();
    },

    dropOne: async (destinationDoc, photoId) => {
      const photo = destinationDoc.galleryPhoto.find((p) => p.photoId === photoId);

      if (!photo) {
        throw new ResponseError(404, 'Data tidak ditemukan', {
          message: 'Foto dengan ID tersebut tidak ditemukan di galeri ini.',
        });
      }

      const photoUrl = photo.url;

      destinationDoc.galleryPhoto.pull(photo._id);

      await destinationDoc.save();

      await deleteOldFile(photoUrl);
    },
  },
};
