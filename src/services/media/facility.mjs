import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';

export const facilityService = {
  add: async (req) => {
    const { destinationDoc, facilityDoc, processedFacilityPhotos } = req;

    if (!processedFacilityPhotos || processedFacilityPhotos.length === 0) {
      throw new ResponseError(422, 'File tidak ada', {
        photo: 'Tidak ada foto untuk ditambahkan.',
      });
    }

    const result = await Destination.updateOne(
      {
        _id: destinationDoc._id,
        'facility.slug': facilityDoc.slug,
      },
      {
        $push: {
          'facility.$.photo': { $each: processedFacilityPhotos },
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(
        500,
        'Gagal memperbarui database. Dokumen tidak ditemukan saat proses update.'
      );
    }

    return processedFacilityPhotos;
  },

  get: async () => {},

  update: async () => {},

  dropAll: async () => {},

  dropOne: async () => {},
};
