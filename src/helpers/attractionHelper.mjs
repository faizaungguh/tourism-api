import { ResponseError } from '#errors/responseError.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Admin } from '#schemas/admin.mjs';

export const validateAttractionAccess = async (
  adminId,
  destinationSlug,
  attractionSlug
) => {
  const [destination, admin, attraction] = await Promise.all([
    Destination.findOne({ slug: destinationSlug })
      .select('_id createdBy')
      .lean(),
    Admin.findOne({ adminId: adminId }).select('_id').lean(),
    Attraction.findOne({ slug: attractionSlug }).select('_id name destination'),
  ]);

  // 1. Cek apakah destinasi, admin, dan wahana ditemukan
  if (!destination) {
    throw new ResponseError(
      404,
      `Destinasi dengan slug '${destinationSlug}' tidak ditemukan.`
    );
  }
  if (!admin) {
    throw new ResponseError(
      404,
      `Admin dengan ID '${adminId}' tidak ditemukan.`
    );
  }
  if (!attraction) {
    throw new ResponseError(
      404,
      `Wahana dengan slug '${attractionSlug}' tidak ditemukan.`
    );
  }

  // 2. Cek otorisasi: apakah admin adalah pemilik destinasi
  if (destination.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(
      403,
      'Akses ditolak. Anda tidak berhak mengelola wahana di destinasi ini.'
    );
  }

  // 3. Cek integritas: apakah wahana benar-benar milik destinasi tersebut
  if (attraction.destination.toString() !== destination._id.toString()) {
    throw new ResponseError(
      404,
      `Wahana '${attractionSlug}' tidak ditemukan di dalam destinasi '${destinationSlug}'.`
    );
  }

  // Jika semua pengecekan lolos, kembalikan dokumen yang relevan
  return { destination, attraction };
};

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
