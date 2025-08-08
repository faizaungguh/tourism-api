import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';

export const facilityService = {
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
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(500, 'Gagal menyimpan foto fasilitas ke database.');
    }

    return processedFacilityPhotos;
  },

  list: async (foundFacility) => {
    return foundFacility.photo || [];
  },

  update: async () => {},

  dropAll: async () => {},

  dropOne: async () => {},
};
