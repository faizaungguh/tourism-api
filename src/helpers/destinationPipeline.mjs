import mongoose from 'mongoose';
import { Destination } from '#schemas/destination.mjs';
import { Category } from '#schemas/category.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

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

  if (sortBy === 'category') {
    sortStage['categoryDetails.name'] = sortDirection;
  } else if (sortBy === 'subdistrict') {
    sortStage['subdistrictDetails.name'] = sortDirection;
  } else if (sortBy === 'destinationTitle') {
    sortStage.destinationTitle = sortDirection;
  } else {
    sortStage.createdAt = -1;
  }

  return { $sort: sortStage };
};

export const listDestination = (validatedQuery) => {
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
              _id: 1,
              destinationTitle: 1,
              category: '$categoryDetails.name',
              categorySlug: '$categoryDetails.slug',
              subdistrict: '$subdistrictDetails.name',
              subdistrictSlug: '$subdistrictDetails.slug',
              address: '$locations.adresses',
            },
          },
        ],
      },
    },
  ];
};

const detailDestinationPipeline = [
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
      destinationTitle: 1,
      description: 1,
      category: '$categoryDetails.name',
      categorySlug: '$categoryDetails.slug',
      createdBy: '$adminDetails.name',
      slug: 1,
      locations: {
        address: '$locations.adresses',
        subdistrict: '$subdistrictDetails.name',
        coordinates: '$locations.coordinates',
      },
      openingHour: 1,
      facility: 1,
      contact: 1,
      ticketPrice: '$ticket',
      parking: 1,
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
    },
  },
];

export const createDestination = async (adminId, validatedRequest) => {
  const [existingDestination, categoryDoc, subdistrictDoc, managerDoc] =
    await Promise.all([
      Destination.findOne({
        destinationTitle: validatedRequest.destinationTitle,
      })
        .select('destinationTitle')
        .lean(),
      Category.findOne({ name: validatedRequest.categories })
        .select('_id')
        .lean(),
      Subdistrict.findOne({ name: validatedRequest.locations.subdistrict })
        .select('_id')
        .lean(),
      Admin.findOne({ adminId }).select('_id').lean(),
    ]);

  const errors = {};
  if (existingDestination) {
    errors.destinationTitle = 'Judul destinasi wisata ini sudah digunakan.';
  }
  if (!categoryDoc) {
    errors.categories = `Kategori dengan nama "${validatedRequest.categories}" tidak ada.`;
  }
  if (!subdistrictDoc) {
    errors.subdistrict = `Kecamatan dengan nama "${validatedRequest.locations.subdistrict}" tidak ada.`;
  }
  if (!managerDoc) {
    errors.manager = `Manajer dengan ID "${adminId}" tidak ditemukan.`;
  }

  if (Object.keys(errors).length > 0) {
    throw new ResponseError(400, 'Gagal menambahkan destinasi baru.', errors);
  }

  /** Jika semua valid, siapkan dan simpan data */
  const { categories, ...rest } = validatedRequest;
  const destinationData = {
    ...rest,
    category: categoryDoc._id,
    locations: {
      ...validatedRequest.locations,
      subdistrict: subdistrictDoc._id,
    },
    createdBy: managerDoc._id,
  };

  const newDestination = new Destination(destinationData);
  const savedDestination = await newDestination.save();

  return savedDestination;
};

export const getDestination = (identifier) => {
  const matchQuery = mongoose.Types.ObjectId.isValid(identifier)
    ? { _id: new mongoose.Types.ObjectId(identifier) }
    : { slug: identifier };

  return [{ $match: matchQuery }, ...detailDestinationPipeline];
};

export const getDestinationSlug = (destinationSlug, categoryId) => {
  return [
    {
      $match: {
        slug: destinationSlug,
        category: new mongoose.Types.ObjectId(categoryId),
      },
    },
    ...detailDestinationPipeline,
  ];
};
