import fs from 'fs/promises';
import path from 'path';
import { ResponseError } from '#errors/responseError.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import { helper } from '#helpers/helper.mjs';

export const attractionService = {
  add: async (destinationDoc, attractionDoc, photosToAdd) => {
    if (!destinationDoc || !attractionDoc || !photosToAdd) {
      throw new ResponseError(500, 'Data tidak lengkap saat dikirim ke service.');
    }

    const destinationTitle = destinationDoc.destinationTitle;
    const attractionTitle = attractionDoc.name;

    const photosWithCaption = photosToAdd.map((photo) => ({
      ...photo,
      caption: `Foto Wahana ${attractionTitle} di ${destinationTitle}`,
    }));

    const result = await Attraction.updateOne(
      { _id: attractionDoc._id },
      {
        $push: { photos: { $each: photosWithCaption } },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(500, 'Gagal menyimpan foto wahana ke database.');
    }

    return photosWithCaption;
  },

  list: async (attractionDoc) => {
    if (!attractionDoc) {
      throw new ResponseError(500, 'Dokumen wahana tidak diterima oleh service.');
    }
    return attractionDoc.photos || [];
  },

  update: async (attractionId, oldPhotoId, newPhotoData) => {
    const result = await Attraction.updateOne(
      { _id: attractionId, 'photos.photoId': oldPhotoId },
      {
        $set: {
          'photos.$.url': newPhotoData.url,
          'photos.$.photoId': newPhotoData.photoId,
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(
        404,
        'Gagal memperbarui foto wahana di database. Data tidak ditemukan.'
      );
    }

    return newPhotoData;
  },

  dropAll: async (destinationDoc, attractionDoc) => {
    if (!destinationDoc || !attractionDoc) {
      throw new ResponseError(500, 'Dokumen destinasi atau wahana tidak diterima oleh service.');
    }

    if (!attractionDoc.photos || attractionDoc.photos.length === 0) {
      return;
    }

    const destinationSlug = destinationDoc.slug;
    const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
    const attractionSlug = attractionDoc.slug;

    const attractionDir = path.join(
      process.cwd(),
      'public',
      'images',
      `destinations/${subdistrictSlug}_${destinationSlug}/attraction/${attractionSlug}`
    );

    try {
      await fs.rm(attractionDir, { recursive: true, force: true });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Gagal menghapus folder ${attractionDir}:`, err);
      }
    }

    const result = await Attraction.updateOne({ _id: attractionDoc._id }, { $set: { photos: [] } });

    if (result.modifiedCount === 0) {
      throw new ResponseError(500, 'Gagal menghapus data foto wahana dari database.');
    }
  },

  dropOne: async (attractionDoc, photoToDelete) => {
    const result = await Attraction.updateOne(
      { _id: attractionDoc._id },
      {
        $pull: { photo: { photoId: photoToDelete.photoId } },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: 'Gagal menghapus foto dari database. Data tidak ditemukan.',
      });
    }

    await helper.Media.destination.cleanupFile(photoToDelete.url);
  },
};
