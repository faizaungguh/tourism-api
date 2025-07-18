import mongoose from 'mongoose';
import { Destination } from '#schemas/destination.mjs';
import { Category } from '#schemas/category.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { adminId } from '#validations/fieldDestination.mjs';

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

export const patchDestination = async (
  destinationSlug,
  adminId,
  validatedRequest
) => {
  const [admin, destinationToUpdate] = await Promise.all([
    Admin.findOne({ adminId }).select('_id').lean(),
    Destination.findOne({ slug: destinationSlug }).select(
      '_id createdBy destinationTitle'
    ),
  ]);

  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan.');
  }
  if (!destinationToUpdate) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan.');
  }
  if (destinationToUpdate.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(
      403,
      'Akses ditolak: Anda bukan pemilik destinasi ini.'
    );
  }

  const errors = {};
  const finalUpdates = {};

  if (
    validatedRequest.destinationTitle &&
    validatedRequest.destinationTitle !== destinationToUpdate.destinationTitle
  ) {
    const existingTitle = await Destination.findOne({
      destinationTitle: validatedRequest.destinationTitle,
      _id: { $ne: destinationToUpdate._id },
    }).lean();
    if (existingTitle) {
      errors.destinationTitle = 'Judul destinasi wisata ini sudah digunakan.';
    } else {
      finalUpdates.destinationTitle = validatedRequest.destinationTitle;
    }
  }

  if (validatedRequest.categories) {
    const categoryDoc = await Category.findOne({
      name: validatedRequest.categories,
    })
      .select('_id')
      .lean();
    if (!categoryDoc) {
      errors.categories = `Kategori "${validatedRequest.categories}" tidak ada.`;
    } else {
      finalUpdates.category = categoryDoc._id;
    }
  }

  if (validatedRequest.locations) {
    if (validatedRequest.locations.subdistrict) {
      const subdistrictDoc = await Subdistrict.findOne({
        name: validatedRequest.locations.subdistrict,
      })
        .select('_id')
        .lean();
      if (!subdistrictDoc) {
        errors.subdistrict = `Kecamatan "${validatedRequest.locations.subdistrict}" tidak ada.`;
      } else {
        finalUpdates['locations.subdistrict'] = subdistrictDoc._id;
      }
    }
    if (validatedRequest.locations.addresses) {
      finalUpdates['locations.addresses'] =
        validatedRequest.locations.addresses;
    }
    if (validatedRequest.locations.coordinates) {
      finalUpdates['locations.coordinates'] =
        validatedRequest.locations.coordinates;
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ResponseError(400, 'Gagal mengubah destinasi wisata.', errors);
  }

  for (const key of Object.keys(validatedRequest)) {
    if (
      key !== 'destinationTitle' &&
      key !== 'categories' &&
      key !== 'locations'
    ) {
      finalUpdates[key] = validatedRequest[key];
    }
  }

  if (Object.keys(finalUpdates).length === 0) {
    return destinationToUpdate;
  }

  const updatedDestination = await Destination.findByIdAndUpdate(
    destinationToUpdate._id,
    { $set: finalUpdates },
    { new: true, runValidators: true }
  );

  return updatedDestination;
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
