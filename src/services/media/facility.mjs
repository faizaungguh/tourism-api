import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';
import { helper } from '#helpers/index.mjs';

export const facilityMedia = {
  add: async (req) => {
    const { foundDestination, foundFacility, processedFacilityPhotos } = req;

    const result = await Destination.updateOne(
      {
        _id: foundDestination._id,
        'facility.slug': foundFacility.slug,
      },
      {
        $push: {
          'facility.$.photo': { $each: processedFacilityPhotos },
        },
      },
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(422, 'Data tidak diproses', {
        message: 'Gagal menyimpan foto fasilitas ke database.',
      });
    }

    return processedFacilityPhotos;
  },

  list: async (foundFacility) => {
    return foundFacility.photo || [];
  },

  update: async (destinationId, facilitySlug, oldPhotoId, newPhotoData) => {
    const result = await Destination.updateOne(
      {
        _id: destinationId,
        'facility.slug': facilitySlug,
      },
      {
        $set: {
          'facility.$[fac].photo.$[foto].url': newPhotoData.url,
          'facility.$[fac].photo.$[foto].photoId': newPhotoData.photoId,
        },
      },
      {
        arrayFilters: [{ 'fac.slug': facilitySlug }, { 'foto.photoId': oldPhotoId }],
      },
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(
        404,
        'Gagal memperbarui foto di database. Data foto tidak ditemukan.',
      );
    }

    return newPhotoData;
  },

  dropAll: async (destinationDoc, facilityDoc) => {
    if (!destinationDoc || !facilityDoc) {
      throw new ResponseError(422, 'Data tidak diproses', {
        message: 'Dokumen destinasi atau fasilitas tidak diterima oleh service.',
      });
    }

    if (!facilityDoc.photo || facilityDoc.photo.length === 0) {
      return;
    }

    const destinationSlug = destinationDoc.slug;
    const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
    const facilitySlug = facilityDoc.slug;

    const facilityDir = path.join(
      process.cwd(),
      'public',
      'images',
      `destinations/${subdistrictSlug}_${destinationSlug}/facility/${facilitySlug}`,
    );

    try {
      await fs.rm(facilityDir, { recursive: true, force: true });
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Gagal menghapus folder ${facilityDir}:`, err);
      }
    }

    const result = await Destination.updateOne(
      {
        _id: destinationDoc._id,
        'facility.slug': facilityDoc.slug,
      },
      {
        $set: { 'facility.$.photo': [] },
      },
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(422, 'Data tidak diproses', {
        message: 'Gagal menghapus data foto fasilitas dari database.',
      });
    }
  },

  dropOne: async (destinationDoc, facilityDoc, photoToDelete) => {
    const result = await Destination.updateOne(
      {
        _id: destinationDoc._id,
        'facility.slug': facilityDoc.slug,
      },
      {
        $pull: { 'facility.$.photo': { photoId: photoToDelete.photoId } },
      },
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: 'Gagal menghapus foto dari database. Data tidak ditemukan.',
      });
    }

    await helper.Media.destination.cleanupFile(photoToDelete.url);
  },
};
