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

    if (destinationToUpdate.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akse ditolak', {
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
      throw new ResponseError(422, 'Proses dihentikan', errors);
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
