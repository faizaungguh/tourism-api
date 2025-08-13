import { validations } from '#validations/validation.mjs';
import { checker } from '#validations/checker.mjs';
import { helper } from '#helpers/index.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import { Destination } from '#schemas/destination.mjs';

export const attractionData = {
  post: async (adminId, slug, request) => {
    const { destination } = await helper.Data.attraction.destinationOwner(adminId, slug);

    const validatedRequest = validations.check.request(checker.attraction.create, request);

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
      attractionSlug,
    );

    const validatedRequest = validations.check.request(checker.attraction.update, request);

    const updatedAttraction = await helper.Data.attraction.update(attraction, validatedRequest);

    const { name, description, ticketType, ticket, slug } = updatedAttraction;
    return { name, description, ticketType, ticket, slug };
  },

  drop: async (adminId, destinationSlug, attractionSlug) => {
    const { destination, attraction } = await helper.Data.attraction.validateAccess(
      adminId,
      destinationSlug,
      attractionSlug,
    );

    await Attraction.findOneAndDelete({ slug: attractionSlug });

    await Destination.findByIdAndUpdate(destination._id, {
      $pull: { attractions: attraction._id },
    });

    return attraction.toObject();
  },
};
