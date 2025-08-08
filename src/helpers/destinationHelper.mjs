import mongoose from 'mongoose';
import { Destination, processOpeningHours } from '#schemas/destination.mjs';
import { Category } from '#schemas/category.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const API_URL = process.env.API_URL || 'http://localhost:3000';

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

const _updateArrayField = async ({
  destinationId,
  existingArray,
  updateArray,
  fieldName,
  keyField,
  preProcessingLogic = (item) => item,
}) => {
  if (!updateArray || !Array.isArray(updateArray)) {
    return;
  }

  updateArray.forEach(preProcessingLogic);

  const existingKeys = new Set((existingArray || []).map((item) => item[keyField]));

  const updates = [];
  const additions = [];
  const deletions = [];

  updateArray.forEach((itemUpdate) => {
    if (itemUpdate._deleted === true) {
      deletions.push(itemUpdate[keyField]);
    } else if (existingKeys.has(itemUpdate[keyField])) {
      updates.push(itemUpdate);
    } else if (itemUpdate[keyField]) {
      additions.push(itemUpdate);
    }
  });

  if (deletions.length > 0) {
    await Destination.updateOne(
      { _id: destinationId },
      { $pull: { [fieldName]: { [keyField]: { $in: deletions } } } }
    );
  }

  if (additions.length > 0) {
    await Destination.updateOne(
      { _id: destinationId },
      { $push: { [fieldName]: { $each: additions } } }
    );
  }

  if (updates.length > 0) {
    for (const itemUpdate of updates) {
      const updateOp = { $set: {} };
      Object.keys(itemUpdate).forEach((prop) => {
        updateOp.$set[`${fieldName}.$.${prop}`] = itemUpdate[prop];
      });
      await Destination.updateOne(
        { _id: destinationId, [`${fieldName}.${keyField}`]: itemUpdate[keyField] },
        updateOp
      );
    }
  }
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
            photo: '$$f.photo',
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
];

const createSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
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
              _id: 0,
              destinationId: 1,
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
    Destination.findOne({ slug: destinationSlug }).select(
      '_id createdBy destinationTitle facility openingHour contact'
    ),
  ]);

  if (!admin)
    throw new ResponseError(404, 'Data tidak ditemukan.', {
      message: `Data dengan ID ${adminId} tidak terdaftar`,
    });

  if (destinationToUpdate.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(403, 'Akses anda ditolak', {
      message: `Anda tidak memiliki hak untuk mengelola ${validatedRequest.destinationTitle}`,
    });
  }

  const updateOperation = { $set: {} };
  const errors = {};

  const { categoryDoc, subdistrictDoc } = await _findRelatedDocs({
    categories: validatedRequest.categories,
    subdistrict: validatedRequest.locations?.subdistrict,
  });

  if (validatedRequest.categories) {
    if (!categoryDoc) errors.categories = `Kategori "${validatedRequest.categories}" tidak ada.`;
    else updateOperation.$set.category = categoryDoc._id;
  }
  if (validatedRequest.locations?.subdistrict) {
    if (!subdistrictDoc)
      errors.subdistrict = `Kecamatan "${validatedRequest.locations.subdistrict}" tidak ada.`;
    else updateOperation.$set['locations.subdistrict'] = subdistrictDoc._id;
  }
  if (validatedRequest.destinationTitle) {
    updateOperation.$set.destinationTitle = validatedRequest.destinationTitle;
  }
  if (Object.keys(errors).length > 0) {
    throw new ResponseError(400, 'Data gagal diubah.', errors);
  }

  if (validatedRequest.description) {
    updateOperation.$set.description = validatedRequest.description;
  }
  if (validatedRequest.locations?.addresses) {
    updateOperation.$set['locations.addresses'] = validatedRequest.locations.addresses;
  }
  if (validatedRequest.locations?.coordinates) {
    updateOperation.$set['locations.coordinates'] = validatedRequest.locations.coordinates;
  }

  if (validatedRequest.ticket && typeof validatedRequest.ticket === 'object') {
    Object.keys(validatedRequest.ticket).forEach((key) => {
      updateOperation.$set[`ticket.${key}`] = validatedRequest.ticket[key];
    });
  }
  if (validatedRequest.parking && typeof validatedRequest.parking === 'object') {
    Object.keys(validatedRequest.parking).forEach((vehicleType) => {
      if (
        validatedRequest.parking[vehicleType] &&
        typeof validatedRequest.parking[vehicleType] === 'object'
      ) {
        for (const prop in validatedRequest.parking[vehicleType]) {
          const path = `parking.${vehicleType}.${prop}`;
          updateOperation.$set[path] = validatedRequest.parking[vehicleType][prop];
        }
      }
    });
  }

  if (Object.keys(updateOperation.$set).length > 0) {
    await Destination.updateOne({ _id: destinationToUpdate._id }, updateOperation);
  }

  await _updateArrayField({
    destinationId: destinationToUpdate._id,
    existingArray: destinationToUpdate.openingHour,
    updateArray: validatedRequest.openingHour,
    fieldName: 'openingHour',
    keyField: 'day',
    preProcessingLogic: (item) => processOpeningHours([item]),
  });

  await _updateArrayField({
    destinationId: destinationToUpdate._id,
    existingArray: destinationToUpdate.facility,
    updateArray: validatedRequest.facility,
    fieldName: 'facility',
    keyField: 'name',
    preProcessingLogic: (facilityUpdate) => {
      if (facilityUpdate.availability === false) {
        facilityUpdate.number = 0;
      }

      if (facilityUpdate.name && !facilityUpdate._id) {
        facilityUpdate.slug = createSlug(facilityUpdate.name);
      }
    },
  });

  await _updateArrayField({
    destinationId: destinationToUpdate._id,
    existingArray: destinationToUpdate.contact,
    updateArray: validatedRequest.contact,
    fieldName: 'contact',
    keyField: 'platform',
  });

  const updatedDocument = await Destination.findById(destinationToUpdate._id).lean();
  return updatedDocument;
};

export const getDestination = (identifier) => {
  const matchQuery = mongoose.Types.ObjectId.isValid(identifier)
    ? { _id: new mongoose.Types.ObjectId(identifier) }
    : { slug: identifier };

  return [{ $match: matchQuery }, ...detailDestinationPipeline];
};
