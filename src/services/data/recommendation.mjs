import { helper } from '#helpers/helper.mjs';
import { Category } from '#schemas/category.mjs';
import { Destination } from '#schemas/destination.mjs';
import { checker } from '#validations/checker.mjs';
import { validate } from '#validations/validate.mjs';

export const recommendationService = {
  show: async (query) => {
    const validatedQuery = validate.check.request(checker.destination.recommendation, query);

    const {
      category,
      lat,
      long,
      weight_distance,
      weight_attractions,
      weight_facilities,
      weight_ticketPrice,
      weight_parkingCapacity,
      limit,
      fields,
    } = validatedQuery;

    const filter = {};
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      const categoryDocs = await Category.find({ slug: { $in: categories } })
        .select('_id')
        .lean();

      if (categoryDocs.length > 0) {
        filter.category = { $in: categoryDocs.map((c) => c._id) };
      } else {
        return [];
      }
    }

    const destinations = await Destination.find(filter)
      .populate('category', 'name')
      .populate({
        path: 'locations.subdistrict',
        select: 'name',
      })
      .lean();

    if (destinations.length === 0) {
      return [];
    }

    const alternatives = destinations.map((dest) => {
      const totalAttractions = dest.attractions?.length || 0;
      const totalFacilities = dest.facility?.length || 0;
      const parkingCapacity =
        (dest.parking?.motorcycle?.capacity || 0) +
        (dest.parking?.car?.capacity || 0) +
        (dest.parking?.bus?.capacity || 0);
      const ticketPrice = dest.ticket?.adult || 0;

      let distance = null;
      if (lat && long && dest.locations?.coordinates?.lat && dest.locations?.coordinates?.long) {
        distance = helper.Data.destination.recommendation.calculateHaversineDistance(
          lat,
          long,
          dest.locations.coordinates.lat,
          dest.locations.coordinates.long
        );
      }

      return {
        id: dest.destinationsId,
        destinationTitle: dest.destinationTitle,
        slug: dest.slug,
        profilePhoto: dest.profilePhoto,
        category: dest.category.name,

        subdistrict: dest.locations?.subdistrict?.name || null,
        address: dest.locations?.addresses || null,
        criteria: {
          distance,
          attractions: totalAttractions,
          facilities: totalFacilities,
          ticketPrice,
          parkingCapacity,
        },
      };
    });

    const weights = {
      distance: weight_distance / 100,
      attractions: weight_attractions / 100,
      facilities: weight_facilities / 100,
      ticketPrice: weight_ticketPrice / 100,
      parkingCapacity: weight_parkingCapacity / 100,
    };

    const criteriaTypes = {
      distance: 'cost',
      attractions: 'benefit',
      facilities: 'benefit',
      ticketPrice: 'cost',
      parkingCapacity: 'benefit',
    };

    if (!lat || !long) {
      delete weights.distance;
      delete criteriaTypes.distance;
      alternatives.forEach((alt) => delete alt.criteria.distance);
    }

    const rankedDestinations = helper.Data.destination.recommendation.calculateTopsis(
      alternatives,
      weights,
      criteriaTypes
    );

    const limitedResults = rankedDestinations.slice(0, limit);

    let finalResults = limitedResults.map((item, index) => ({
      ranking: index + 1,
      ...item,
    }));

    if (fields) {
      const selectedFields = fields.split(',').map((f) => f.trim());
      finalResults = finalResults.map((destination) => {
        const newObj = {};
        selectedFields.forEach((field) => {
          if (Object.prototype.hasOwnProperty.call(destination, field)) {
            newObj[field] = destination[field];
          }
        });
        return newObj;
      });
    }

    return finalResults;
  },
};
