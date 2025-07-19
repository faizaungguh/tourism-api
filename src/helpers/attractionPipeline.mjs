import { ResponseError } from '#errors/responseError.mjs';
import { Attraction } from '#schemas/attraction.mjs';

export const createAttraction = async (destinationId, validatedRequest) => {
  const existingAttraction = await Attraction.findOne({
    name: validatedRequest.name,
    destination: destinationId,
  }).select('name');

  if (existingAttraction) {
    throw new ResponseError(409, 'Nama wahana sudah ada di destinasi ini.', {
      name: `Wahana dengan nama '${validatedRequest.name}' sudah terdaftar.`,
    });
  }

  const attractionData = {
    ...validatedRequest,
    destination: destinationId,
  };

  const newAttraction = new Attraction(attractionData);
  const savedAttraction = await newAttraction.save();

  return savedAttraction;
};

export const patchAttraction = async (attractionToUpdate, validatedRequest) => {
  if (
    validatedRequest.name &&
    validatedRequest.name !== attractionToUpdate.name
  ) {
    const existingAttraction = await Attraction.findOne({
      name: validatedRequest.name,
      destination: attractionToUpdate.destination,
      _id: { $ne: attractionToUpdate._id },
    }).select('name');

    if (existingAttraction) {
      throw new ResponseError(409, 'Nama wahana sudah ada di destinasi ini.', {
        name: `Wahana dengan nama '${validatedRequest.name}' sudah terdaftar.`,
      });
    }
  }

  Object.assign(attractionToUpdate, validatedRequest);
  const updatedAttraction = await attractionToUpdate.save();

  return updatedAttraction;
};
