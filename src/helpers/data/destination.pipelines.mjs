import { config } from '#configs/variable.mjs';

const API_URL = config.APP_URL || 'http://localhost:3000';

const buildFilterStage = (validatedQuery) => {
  const { search, category, subdistrict } = validatedQuery;
  const andClauses = [];

  if (search) {
    andClauses.push({
      $or: [
        { destinationTitle: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ],
    });
  }

  if (category) {
    andClauses.push({
      $or: [
        { 'categoryDetails.name': { $regex: `^${category}$`, $options: 'i' } },
        { 'categoryDetails.slug': category },
      ],
    });
  }

  if (subdistrict) {
    andClauses.push({
      $or: [
        {
          'subdistrictDetails.name': {
            $regex: `^${subdistrict}$`,
            $options: 'i',
          },
        },
        { 'subdistrictDetails.slug': subdistrict },
      ],
    });
  }

  return andClauses.length > 0 ? [{ $match: { $and: andClauses } }] : [];
};

const buildSortStage = (validatedQuery) => {
  const { sort, sortBy } = validatedQuery;
  const sortDirection = sort === 'asc' ? 1 : -1;
  const sortStage = {};

  if (sortBy === 'category') sortStage['categoryDetails.name'] = sortDirection;
  else if (sortBy === 'subdistrict') sortStage['subdistrictDetails.name'] = sortDirection;
  else if (sortBy === 'destinationTitle') sortStage.destinationTitle = sortDirection;
  else sortStage.createdAt = -1;

  return { $sort: sortStage };
};

export const destinationPipeline = {
  buildList: (validatedQuery) => {
    const { page, size } = validatedQuery;
    const skip = (page - 1) * size;
    const filterStage = buildFilterStage(validatedQuery);
    const sortStage = buildSortStage(validatedQuery);

    return [
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      {
        $lookup: {
          from: 'subdistricts',
          localField: 'locations.subdistrict',
          foreignField: '_id',
          as: 'subdistrictDetails',
        },
      },
      { $unwind: '$categoryDetails' },
      { $unwind: '$subdistrictDetails' },
      ...filterStage,
      {
        $facet: {
          metadata: [{ $count: 'totalItems' }],
          data: [
            sortStage,
            { $skip: skip },
            { $limit: size },
            {
              $project: {
                _id: 0,
                destinationId: 1,
                destinationTitle: 1,
                headlinePhoto: {
                  $cond: {
                    if: '$headlinePhoto',
                    then: { $concat: [API_URL, '$headlinePhoto'] },
                    else: '$$REMOVE',
                  },
                },
                category: '$categoryDetails.name',
                categorySlug: '$categoryDetails.slug',
                subdistrict: '$subdistrictDetails.name',
                subdistrictSlug: '$subdistrictDetails.slug',
                address: '$locations.addresses',
              },
            },
          ],
        },
      },
    ];
  },

  detailDestination: [
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    {
      $lookup: {
        from: 'subdistricts',
        localField: 'locations.subdistrict',
        foreignField: '_id',
        as: 'subdistrictDetails',
      },
    },
    {
      $lookup: {
        from: 'admins',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'adminDetails',
      },
    },
    {
      $lookup: {
        from: 'attractions',
        localField: 'attractions',
        foreignField: '_id',
        as: 'attractionList',
      },
    },
    { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
    {
      $unwind: { path: '$subdistrictDetails', preserveNullAndEmptyArrays: true },
    },
    { $unwind: { path: '$adminDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        destinationsId: 1,
        destinationTitle: 1,
        profilePhoto: {
          $cond: {
            if: '$profilePhoto',
            then: { $concat: [API_URL, '$profilePhoto'] },
            else: '$$REMOVE',
          },
        },
        headlinePhoto: {
          $cond: {
            if: '$headlinePhoto',
            then: { $concat: [API_URL, '$headlinePhoto'] },
            else: '$$REMOVE',
          },
        },
        galleryPhoto: {
          $cond: {
            if: { $and: [{ $isArray: '$galleryPhoto' }, { $gt: [{ $size: '$galleryPhoto' }, 0] }] },
            then: {
              $map: {
                input: '$galleryPhoto',
                as: 'photo',
                in: {
                  url: { $concat: [API_URL, '$$photo.url'] },
                  photoId: '$$photo.photoId',
                  caption: '$$photo.caption',
                },
              },
            },
            else: '$$REMOVE',
          },
        },
        description: 1,
        category: '$categoryDetails.name',
        categorySlug: '$categoryDetails.slug',
        createdBy: '$adminDetails.name',
        slug: 1,
        locations: {
          address: '$locations.addresses',
          subdistrict: '$subdistrictDetails.name',
          coordinates: '$locations.coordinates',
          mapLink: '$locations.link',
        },
        attractions: {
          $map: {
            input: '$attractionList',
            as: 'attraction',
            in: {
              name: '$$attraction.name',
              slug: '$$attraction.slug',
              description: '$$attraction.description',
              ticketType: '$$attraction.ticketType',
              ticket: '$$attraction.ticket',
            },
          },
        },
        openingHour: {
          $map: {
            input: '$openingHour',
            as: 'oh',
            in: {
              day: '$$oh.day',
              hours: '$$oh.hours',
              isClosed: '$$oh.isClosed',
            },
          },
        },
        facility: {
          $map: {
            input: '$facility',
            as: 'f',
            in: {
              name: '$$f.name',
              availability: '$$f.availability',
              number: '$$f.number',
              disabilityAccess: '$$f.disabilityAccess',
              photo: {
                $cond: {
                  if: {
                    $and: [{ $isArray: '$$f.photo' }, { $gt: [{ $size: '$$f.photo' }, 0] }],
                  },
                  then: {
                    $map: {
                      input: '$$f.photo',
                      as: 'photo',
                      in: {
                        url: { $concat: [API_URL, '$$photo.url'] },
                        photoId: '$$photo.photoId',
                        caption: '$$photo.caption',
                      },
                    },
                  },
                  else: '$$REMOVE',
                },
              },
            },
          },
        },
        contact: {
          $map: {
            input: '$contact',
            as: 'c',
            in: {
              platform: '$$c.platform',
              value: '$$c.value',
            },
          },
        },
        ticketPrice: '$ticket',
        parking: 1,
      },
    },
  ],
};
