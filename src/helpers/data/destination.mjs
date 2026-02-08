import mongoose from 'mongoose';
import { Destination, processOpeningHours } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';
import { Category } from '#schemas/category.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { destinationPipeline } from './destination.pipelines.mjs';

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
      { $pull: { [fieldName]: { [keyField]: { $in: deletions } } } },
    );
  }

  if (additions.length > 0) {
    await Destination.updateOne(
      { _id: destinationId },
      { $push: { [fieldName]: { $each: additions } } },
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
        updateOp,
      );
    }
  }
};

const createSlug = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

const _buildUpdateSet = (validatedRequest, categoryDoc, subdistrictDoc) => {
  const updateSet = {};
  const errors = {};

  /** Category */
  if (validatedRequest.categories) {
    if (!categoryDoc) errors.categories = `Kategori "${validatedRequest.categories}" tidak ada.`;
    else updateSet.category = categoryDoc._id;
  }

  /** Subdistrict */
  if (validatedRequest.locations?.subdistrict) {
    if (!subdistrictDoc)
      errors.subdistrict = `Kecamatan "${validatedRequest.locations.subdistrict}" tidak ada.`;
    else updateSet['locations.subdistrict'] = subdistrictDoc._id;
  }

  /** */
  if (validatedRequest.destinationTitle) {
    updateSet.destinationTitle = validatedRequest.destinationTitle;
  }

  if (Object.keys(errors).length > 0) {
    throw new ResponseError(422, 'Proses dihentikan', errors);
  }

  /** Deskripsi */
  if (validatedRequest.description) updateSet.description = validatedRequest.description;

  /** Alamat */
  if (validatedRequest.locations?.addresses)
    updateSet['locations.addresses'] = validatedRequest.locations.addresses;

  /** Koordinat */
  if (validatedRequest.locations?.coordinates)
    updateSet['locations.coordinates'] = validatedRequest.locations.coordinates;

  /** Tiket */
  if (validatedRequest.ticket && typeof validatedRequest.ticket === 'object') {
    Object.entries(validatedRequest.ticket).forEach(([key, value]) => {
      updateSet[`ticket.${key}`] = value;
    });
  }

  /** Parkir */
  if (validatedRequest.parking && typeof validatedRequest.parking === 'object') {
    Object.entries(validatedRequest.parking).forEach(([type, data]) => {
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([prop, value]) => {
          updateSet[`parking.${type}.${prop}`] = value;
        });
      }
    });
  }

  return updateSet;
};

export const destinationHelper = {
  list: (validatedQuery) => {
    return destinationPipeline.buildList(validatedQuery);
  },

  get: (identifier) => {
    const matchConditions = [];

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      matchConditions.push({ _id: new mongoose.Types.ObjectId(identifier) });
    }

    matchConditions.push({ slug: identifier });
    matchConditions.push({ destinationsId: identifier });

    const matchQuery = { $or: matchConditions };

    return [{ $match: matchQuery }, ...destinationPipeline.detailDestination];
  },

  create: async (adminId, validatedRequest) => {
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
      throw new ResponseError(422, 'Proses dihentikan', errors);
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
  },

  patch: async (destinationSlug, adminId, validatedRequest) => {
    const [admin, destinationToUpdate] = await Promise.all([
      Admin.findOne({ adminId }).select('_id').lean(),
      Destination.findOne({ slug: destinationSlug }).select(
        '_id createdBy destinationTitle facility openingHour contact',
      ),
    ]);

    if (!admin)
      throw new ResponseError(404, 'Data tidak ditemukan.', {
        message: `Data dengan ID ${adminId} tidak terdaftar`,
      });

    if (!destinationToUpdate)
      throw new ResponseError(404, 'Data tidak ditemukan.', {
        message: `Destinasi wisata tidak ditemukan.`,
      });

    if (destinationToUpdate.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak', {
        message: `Anda tidak memiliki hak untuk mengelola ${destinationToUpdate.destinationTitle}`,
      });
    }

    const { categoryDoc, subdistrictDoc } = await _findRelatedDocs({
      categories: validatedRequest.categories,
      subdistrict: validatedRequest.locations?.subdistrict,
    });

    const updateSet = _buildUpdateSet(validatedRequest, categoryDoc, subdistrictDoc);

    if (Object.keys(updateSet).length > 0) {
      await Destination.findOneAndUpdate({ _id: destinationToUpdate._id }, { $set: updateSet });
    }

    const arrayUpdates = [
      {
        field: 'openingHour',
        key: 'day',
        logic: (item) => processOpeningHours([item]),
      },
      {
        field: 'facility',
        key: 'name',
        logic: (facilityUpdate) => {
          if (facilityUpdate.availability === false) facilityUpdate.number = 0;
          if (facilityUpdate.name && !facilityUpdate._id)
            facilityUpdate.slug = createSlug(facilityUpdate.name);
        },
      },
      { field: 'contact', key: 'platform' },
    ];

    for (const { field, key, logic } of arrayUpdates) {
      await _updateArrayField({
        destinationId: destinationToUpdate._id,
        existingArray: destinationToUpdate[field],
        updateArray: validatedRequest[field],
        fieldName: field,
        keyField: key,
        preProcessingLogic: logic,
      });
    }

    const updatedDocument = await Destination.findById(destinationToUpdate._id).lean();
    return updatedDocument;
  },

  validateCategoryAvailability: async (categoryQuery) => {
    if (!categoryQuery) return;

    const categoryDoc = await Category.findOne({
      $or: [{ name: new RegExp(`^${categoryQuery}$`, 'i') }, { slug: categoryQuery }],
    });

    if (!categoryDoc) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Mohon maaf, tidak ada Kategori dengan nilai "${categoryQuery}".`,
      });
    }
  },

  validateCategoryEmptyResult: (categoryQuery, totalItems) => {
    if (categoryQuery && totalItems === 0) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Belum ada destinasi untuk kategori "${categoryQuery}".`,
      });
    }
  },
};
