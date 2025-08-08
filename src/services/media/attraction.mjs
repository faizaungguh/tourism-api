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

  dropAll: async () => {},

  dropOne: async () => {},
};
