import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/attraction.mjs';
import * as helper from '#helpers/data/attraction.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Admin } from '#schemas/admin.mjs';

export const attractionService = {
  post: async (adminId, slug, request) => {
    const [destination, admin] = await Promise.all([
      Destination.findOne({ slug: slug }).select('_id createdBy').lean(),
      Admin.findOne({ adminId: adminId }).select('_id').lean(),
    ]);

    if (!destination) {
      throw new ResponseError(404, 'Destinasi tidak ditemukan', {
        message: `Destinasi dengan slug '${slug}' tidak ditemukan.`,
      });
    }

    if (destination.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Anda tidak memiliki izin untuk menambahkan wahana ke destinasi ini.',
      });
    }

    const validatedRequest = validate.requestCheck(checker.createAttractionValidation, request);

    const newAttraction = await helper.createAttraction(destination._id, validatedRequest);

    await Destination.findByIdAndUpdate(destination._id, {
      $push: { attractions: newAttraction._id },
    });

    const { name, description, ticketType, ticket } = newAttraction;
    return { name, description, ticketType, ticket };
  },

  update: async (adminId, destinationSlug, attractionSlug, request) => {
    const { attraction } = await helper.validateAttractionAccess(
      adminId,
      destinationSlug,
      attractionSlug
    );

    const validatedRequest = validate.requestCheck(checker.patchAttractionValidation, request);

    const updatedAttraction = await helper.patchAttraction(attraction, validatedRequest);

    const { name, description, ticketType, ticket, slug } = updatedAttraction;
    return { name, description, ticketType, ticket, slug };
  },

  drop: async (adminId, destinationSlug, attractionSlug) => {
    const { destination, attraction } = await helper.validateAttractionAccess(
      adminId,
      destinationSlug,
      attractionSlug
    );

    await Attraction.findOneAndDelete({ slug: attractionSlug });

    await Destination.findByIdAndUpdate(destination._id, {
      $pull: { attractions: attraction._id },
    });

    return attraction.toObject();
  },
};
