import { validate } from '#validations/validate.mjs';
import { checker } from '#validations/checker.mjs';
import { helper } from '#helpers/helper.mjs';
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
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Destinasi dengan slug '${slug}' tidak ditemukan.`,
      });
    }

    if (destination.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Anda tidak memiliki izin untuk menambahkan wahana ke destinasi ini.',
      });
    }

    const validatedRequest = validate.check.request(checker.attraction.create, request);

    const newAttraction = await helper.Data.attraction.create(destination._id, validatedRequest);

    await Destination.findByIdAndUpdate(destination._id, {
      $push: { attractions: newAttraction._id },
    });

    const { name, description, ticketType, ticket } = newAttraction;
    return { name, description, ticketType, ticket };
  },

  update: async (adminId, destinationSlug, attractionSlug, request) => {
    const { attraction } = await helper.Data.attraction.validateAccess(
      adminId,
      destinationSlug,
      attractionSlug
    );

    const validatedRequest = validate.check.request(checker.attraction.update, request);

    const updatedAttraction = await helper.Data.attraction.patch(attraction, validatedRequest);

    const { name, description, ticketType, ticket, slug } = updatedAttraction;
    return { name, description, ticketType, ticket, slug };
  },

  drop: async (adminId, destinationSlug, attractionSlug) => {
    const { destination, attraction } = await helper.Data.attraction.validateAccess(
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
