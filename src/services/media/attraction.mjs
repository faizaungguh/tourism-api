import fs from 'fs/promises';
import path from 'path';
import { ResponseError } from '#errors/responseError.mjs';
import { Attraction } from '#schemas/attraction.mjs';

export const attractionService = {
  add: async (attractionDoc, photosToAdd) => {
    if (!attractionDoc || !photosToAdd) {
      throw new ResponseError(500, 'Data tidak lengkap saat dikirim ke service.');
    }

    const result = await Attraction.updateOne(
      { _id: attractionDoc._id },
      {
        $push: { photos: { $each: photosToAdd } },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(500, 'Gagal menyimpan foto wahana ke database.');
    }

    return photosToAdd;
  },

  list: async () => {},

  update: async () => {},

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

  dropOne: async () => {},
};
