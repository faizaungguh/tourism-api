import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Attraction } from '#schemas/attraction.mjs';

export const attractionHelper = {
  validateAccess: async (adminId, destinationSlug, attractionSlug) => {
    const [destination, admin, attraction] = await Promise.all([
      Destination.findOne({ slug: destinationSlug }).select('_id createdBy').lean(),
      Admin.findOne({ adminId: adminId }).select('_id').lean(),
      Attraction.findOne({ slug: attractionSlug }).select('_id name destination'),
    ]);

    if (!destination) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Destinasi dengan slug '${destinationSlug}' tidak ditemukan.`,
      });
    }
    if (!admin) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Admin dengan ID '${adminId}' tidak ditemukan.`,
      });
    }
    if (!attraction) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Wahana dengan slug '${attractionSlug}' tidak ditemukan.`,
      });
    }

    if (destination.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak', {
        message: 'Anda tidak memiliki hak mengelola wahana di destinasi ini.',
      });
    }

    if (attraction.destination.toString() !== destination._id.toString()) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Wahana '${attractionSlug}' tidak ditemukan di dalam destinasi '${destinationSlug}'.`,
      });
    }

    return { destination, attraction };
  },

  create: async (destinationId, validatedRequest) => {
    const existingAttraction = await Attraction.findOne({
      name: validatedRequest.name,
      destination: destinationId,
    }).select('name');

    if (existingAttraction) {
      throw new ResponseError(409, 'Duplikasi data.', {
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
  },

  patch: async (attractionToUpdate, validatedRequest) => {
    if (validatedRequest.name && validatedRequest.name !== attractionToUpdate.name) {
      const existingAttraction = await Attraction.findOne({
        name: validatedRequest.name,
        destination: attractionToUpdate.destination,
        _id: { $ne: attractionToUpdate._id },
      }).select('name');

      if (existingAttraction) {
        throw new ResponseError(409, 'Duplikasi Data.', {
          name: `Wahana dengan nama '${validatedRequest.name}' sudah terdaftar.`,
        });
      }
    }

    Object.assign(attractionToUpdate, validatedRequest);
    const updatedAttraction = await attractionToUpdate.save();

    const { id, ...dataToReturn } = updatedAttraction.toObject();

    return dataToReturn;
  },
};
