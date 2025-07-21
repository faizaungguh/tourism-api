import mongoose from 'mongoose';
import { Destination } from '#schemas/destination.mjs';
import { Category } from '#schemas/category.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const _findRelatedDocs = async ({ categories, subdistrict }) => {
  const promises = [];

  if (categories) {
    promises.push(Category.findOne({ name: categories }).select('_id').lean());
  } else {
    promises.push(Promise.resolve(null));
  }

  if (subdistrict) {
    promises.push(Subdistrict.findOne({ name: subdistrict }).select('_id').lean());
  } else {
    promises.push(Promise.resolve(null));
  }

  const [categoryDoc, subdistrictDoc] = await Promise.all(promises);
  return { categoryDoc, subdistrictDoc };
};

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
        address: '$locations.addresses',
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
              address: '$locations.addresses',
            },
          },
        ],
      },
    },
  ];
};

export const createDestination = async (adminId, validatedRequest) => {
  const [existingDestination, managerDoc] = await Promise.all([
    Destination.findOne({ destinationTitle: validatedRequest.destinationTitle })
      .select('destinationTitle')
      .lean(),
    Admin.findOne({ adminId }).select('_id').lean(),
  ]);

  const { categoryDoc, subdistrictDoc } = await _findRelatedDocs({
    categories: validatedRequest.categories,
    subdistrict: validatedRequest.locations.subdistrict,
  });

  const errors = {};
  if (existingDestination)
    errors.destinationTitle = `Tempat wisata dengan nama ${validatedRequest.destinationTitle} sudah digunakan, masukkan nama lain.`;
  if (!managerDoc) errors.manager = `Manajer dengan ID "${adminId}" tidak ditemukan.`;
  if (!categoryDoc)
    errors.categories = `Kategori dengan nama "${validatedRequest.categories}" tidak ada.`;
  if (!subdistrictDoc)
    errors.subdistrict = `Kecamatan dengan nama "${validatedRequest.locations.subdistrict}" tidak ada.`;

  if (Object.keys(errors).length > 0) {
    throw new ResponseError(400, 'Data gagal ditambahkan.', errors);
  }

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
  return newDestination.save();
};

export const patchDestination = async (destinationSlug, adminId, validatedRequest) => {
  const [admin, destinationToUpdate] = await Promise.all([
    Admin.findOne({ adminId }).select('_id').lean(),
    Destination.findOne({ slug: destinationSlug }).select('_id createdBy destinationTitle'),
  ]);

  if (!admin)
    throw new ResponseError(404, 'Data tidak ditemukan.', {
      message: `Data dengan ID ${adminId} tidak terdaftar`,
    });
  if (!destinationToUpdate)
    throw new ResponseError(404, 'Destinasi tidak ditemukan.', {
      message: `Tempat wisata dengan nama ${validatedRequest.destinationTitle} telah terdaftar`,
    });
  if (destinationToUpdate.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(403, 'Akses anda ditolak', {
      message: `Anda tidak memiliki hak untuk mengelola ${validatedRequest.destinationTitle}`,
    });
  }

  const errors = {};
  const finalUpdates = {};

  const { categoryDoc, subdistrictDoc } = await _findRelatedDocs({
    categories: validatedRequest.categories,
    subdistrict: validatedRequest.locations?.subdistrict,
  });

  if (validatedRequest.categories) {
    if (!categoryDoc) errors.categories = `Kategori "${validatedRequest.categories}" tidak ada.`;
    else finalUpdates.category = categoryDoc._id;
  }

  if (validatedRequest.locations?.subdistrict) {
    if (!subdistrictDoc)
      errors.subdistrict = `Kecamatan "${validatedRequest.locations.subdistrict}" tidak ada.`;
    else finalUpdates['locations.subdistrict'] = subdistrictDoc._id;
  }

  if (
    validatedRequest.destinationTitle &&
    validatedRequest.destinationTitle !== destinationToUpdate.destinationTitle
  ) {
    const existingTitle = await Destination.findOne({
      destinationTitle: validatedRequest.destinationTitle,
      _id: { $ne: destinationToUpdate._id },
    }).lean();
    if (existingTitle) errors.destinationTitle = 'Judul destinasi wisata ini sudah digunakan.';
    else finalUpdates.destinationTitle = validatedRequest.destinationTitle;
  }

  if (Object.keys(errors).length > 0) {
    throw new ResponseError(400, 'Data gagal diubah.', errors);
  }

  for (const key of Object.keys(validatedRequest)) {
    if (key !== 'destinationTitle' && key !== 'categories' && key !== 'locations') {
      finalUpdates[key] = validatedRequest[key];
    }
  }

  if (validatedRequest.locations?.addresses) {
    finalUpdates['locations.addresses'] = validatedRequest.locations.addresses;
  }
  if (validatedRequest.locations?.coordinates) {
    finalUpdates['locations.coordinates'] = validatedRequest.locations.coordinates;
  }

  if (Object.keys(finalUpdates).length === 0) {
    return destinationToUpdate;
  }

  return Destination.findByIdAndUpdate(
    destinationToUpdate._id,
    { $set: finalUpdates },
    { new: true, runValidators: true }
  );
};

export const getDestination = (identifier) => {
  const matchQuery = mongoose.Types.ObjectId.isValid(identifier)
    ? { _id: new mongoose.Types.ObjectId(identifier) }
    : { slug: identifier };

  return [{ $match: matchQuery }, ...detailDestinationPipeline];
};
