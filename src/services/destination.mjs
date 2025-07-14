import mongoose from 'mongoose';
import * as checker from '#validations/destination.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/destinationPipeline.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { categorySchema } from '#schemas/category.mjs';
import { SubdistrictSchema } from '#schemas/subdistrict.mjs';
import { attractionSchema } from '#schemas/attraction.mjs';
import { adminSchema } from '#schemas/admin.mjs';

const Destination = mongoose.model('Destination', destinationSchema);
const Category = mongoose.model('Category', categorySchema);
const Subdistrict = mongoose.model('Subdistrict', SubdistrictSchema);
const Attraction = mongoose.model('Attraction', attractionSchema);
const Admin = mongoose.model('Admin', adminSchema);

export const create = async (request) => {
  validate.isNotEmpty(request);
  /** validasi request */
  const validatedRequest = validate.requestCheck(
    checker.destinationValidation,
    request
  );

  /** 1. Cek adminId dan role manager terlebih dahulu */
  const admin = await Admin.findOne({
    adminId: validatedRequest.adminId,
  }).select('role');

  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan.', {
      adminId: `Admin dengan ID "${validatedRequest.adminId}" tidak ditemukan.`,
    });
    S;
  }

  if (admin.role !== 'manager') {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Hanya manajer yang dapat membuat destinasi wisata',
    });
  }

  /** 2. Cek duplikasi judul dan validasi keberadaan Kategori & Kecamatan */
  const [existingDestination, categoryDoc, subdistrictDoc] = await Promise.all([
    Destination.findOne({
      destinationTitle: validatedRequest.destinationTitle,
    }).select('destinationTitle'),
    Category.findOne({
      name: validatedRequest.categories,
    }).select('_id'),
    Subdistrict.findOne({
      name: validatedRequest.locations.subdistrict,
    }).select('_id'),
  ]);

  /** 3. Munculkan pesan error jika ada data yang tidak valid */
  if (existingDestination) {
    throw new ResponseError(409, 'Judul destinasi sudah ada.', {
      destinationTitle: 'Judul destinasi wisata ini sudah digunakan.',
    });
  }

  if (!categoryDoc) {
    throw new ResponseError(404, 'Kategori tidak ditemukan.', {
      categories: `Kategori dengan nama "${validatedRequest.categories}" tidak ada.`,
    });
  }

  if (!subdistrictDoc) {
    throw new ResponseError(404, 'Kecamatan tidak ditemukan.', {
      subdistrict: `Kecamatan dengan nama "${validatedRequest.locations.subdistrict}" tidak ada.`,
    });
  }

  /** 4. Jika semua valid, siapkan dan simpan data */
  validatedRequest.categories = categoryDoc._id;
  validatedRequest.locations.subdistrict = subdistrictDoc._id;

  validatedRequest.createdBy = admin._id;
  delete validatedRequest.adminId;

  const newDestination = new Destination(validatedRequest);
  const savedDestination = await newDestination.save();

  /** Ambil data yang baru disimpan dengan detail yang sudah di-populate */
  const pipeline = helper.getDestination(savedDestination._id);
  const [result] = await Destination.aggregate(pipeline);
  return result;
};

export const getAll = async (query) => {
  /** Validasi dan ambil nilai default dari query */
  const validatedQuery = validate.requestCheck(
    checker.listDestinationValidation,
    query
  );

  /** Dapatkan aggregation pipeline dari helper */
  const pipeline = helper.listDestination(validatedQuery);

  const result = await Destination.aggregate(pipeline);

  const data = result[0].data;
  const totalItems = result[0].metadata[0]
    ? result[0].metadata[0].totalItems
    : 0;

  const { page, size } = validatedQuery;

  return {
    result: data,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / size),
      totalItems,
      size,
    },
  };
};

export const getDetail = async (destinationSlug) => {
  /** Validasi slug */
  if (
    !destinationSlug ||
    typeof destinationSlug !== 'string' ||
    destinationSlug.trim() === ''
  ) {
    throw new ResponseError(400, 'Destination slug tidak valid.', {
      message: 'Slug destinasi harus berupa string yang tidak kosong.',
    });
  }

  const pipeline = helper.getDestination(destinationSlug);
  const result = await Destination.aggregate(pipeline);

  if (!result || result.length === 0) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan.', {
      message: `Destinasi dengan slug "${destinationSlug}" tidak ditemukan`,
    });
  }

  return result[0];
};

export const getDetailSlug = async (categorySlug, destinationSlug) => {
  if (!categorySlug || typeof categorySlug !== 'string') {
    throw new ResponseError(400, 'Category slug tidak valid.', {
      message: `Kategori ${categorySlug} tidak valid`,
    });
  }
  if (!destinationSlug || typeof destinationSlug !== 'string') {
    throw new ResponseError(400, 'Destination slug tidak valid.', {
      message: `Destinasi ${destinationSlug} tidak valid`,
    });
  }

  const category = await Category.findOne({ slug: categorySlug })
    .select('_id')
    .lean();
  if (!category) {
    throw new ResponseError(
      404,
      `Kategori dengan slug "${categorySlug}" tidak ditemukan.`
    );
  }

  const pipeline = helper.getDestinationSlug(destinationSlug, category._id);
  const result = await Destination.aggregate(pipeline);

  if (result.length === 0) {
    throw new ResponseError(
      404,
      `Destinasi dengan slug "${destinationSlug}" tidak ditemukan di kategori ini.`
    );
  }
  return result[0];
};

export const update = async (id, adminId, request) => {
  validate.isValidId(id);
  validate.isNotEmpty(request);

  if (!adminId) {
    throw new ResponseError(401, 'Unauthorized', {
      message: 'Admin ID diperlukan untuk otorisasi.',
    });
  }

  if (!adminId.startsWith('mng-')) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Hanya manajer yang dapat mengubah destinasi.',
    });
  }

  const [admin, destinationToUpdate] = await Promise.all([
    Admin.findOne({ adminId }).select('_id').lean(),
    Destination.findById(id).select('createdBy destinationTitle').lean(),
  ]);

  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan.', {
      adminId: `Admin dengan ID "${adminId}" tidak ditemukan.`,
    });
  }

  if (!destinationToUpdate) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan.', {
      id: `Destinasi dengan ID "${id}" tidak ditemukan.`,
    });
  }

  if (destinationToUpdate.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Anda tidak memiliki izin untuk mengubah destinasi ini.',
    });
  }

  const validatedRequest = validate.requestCheck(
    checker.patchDestinationValidation,
    request
  );

  if (
    validatedRequest.destinationTitle &&
    validatedRequest.destinationTitle !== destinationToUpdate.destinationTitle
  ) {
    const existingDestination = await Destination.findOne({
      destinationTitle: validatedRequest.destinationTitle,
      _id: { $ne: id },
    }).select('destinationTitle');

    if (existingDestination) {
      throw new ResponseError(409, 'Judul destinasi sudah ada.', {
        destinationTitle: 'Judul destinasi wisata ini sudah digunakan.',
      });
    }
  } else if (
    validatedRequest.destinationTitle &&
    validatedRequest.destinationTitle === destinationToUpdate.destinationTitle
  ) {
    delete validatedRequest.destinationTitle;
    if (Object.keys(validatedRequest).length === 0) {
      const pipeline = helper.getDestination(id);
      const result = await Destination.aggregate(pipeline);
      return result[0];
    }
  }

  if (validatedRequest.categories) {
    const categoryDoc = await Category.findOne({
      name: validatedRequest.categories,
    })
      .select('_id')
      .lean();
    if (!categoryDoc) {
      throw new ResponseError(404, 'Kategori tidak ditemukan.', {
        categories: `Kategori dengan nama "${validatedRequest.categories}" tidak ada.`,
      });
    }
    validatedRequest.categories = categoryDoc._id;
  }

  if (validatedRequest.locations && validatedRequest.locations.subdistrict) {
    const subdistrictDoc = await Subdistrict.findOne({
      name: validatedRequest.locations.subdistrict,
    })
      .select('_id')
      .lean();
    if (!subdistrictDoc) {
      throw new ResponseError(404, 'Kecamatan tidak ditemukan.', {
        subdistrict: `Kecamatan dengan nama "${validatedRequest.locations.subdistrict}" tidak ada.`,
      });
    }
    validatedRequest.locations.subdistrict = subdistrictDoc._id;
  }

  await Destination.findByIdAndUpdate(id, { $set: validatedRequest });

  const pipeline = helper.getDestination(id);
  const result = await Destination.aggregate(pipeline);

  return result[0];
};

export const drop = async (destinationSlug, adminId) => {
  if (
    !destinationSlug ||
    typeof destinationSlug !== 'string' ||
    destinationSlug.trim() === ''
  ) {
    throw new ResponseError(400, 'Destination slug tidak valid.', {
      message: 'Slug destinasi harus berupa string yang tidak kosong.',
    });
  }

  if (!adminId) {
    throw new ResponseError(401, 'Unauthorized', {
      message: 'Admin ID diperlukan untuk otorisasi.',
    });
  }

  if (!adminId.startsWith('mng-')) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Hanya manajer yang dapat menghapus destinasi.',
    });
  }

  const [admin, destinationToDelete] = await Promise.all([
    Admin.findOne({ adminId }).select('_id').lean(),
    Destination.findOne({ slug: destinationSlug })
      .select('_id createdBy destinationTitle attractions')
      .lean(),
  ]);

  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan.', {
      adminId: `Admin dengan ID "${adminId}" tidak ditemukan.`,
    });
  }

  if (!destinationToDelete) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan.', {
      message: `Destinasi dengan slug "${destinationSlug}" tidak ditemukan.`,
    });
  }

  if (destinationToDelete.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Anda tidak memiliki izin untuk menghapus destinasi ini.',
    });
  }

  if (
    destinationToDelete.attractions &&
    destinationToDelete.attractions.length > 0
  ) {
    await Attraction.deleteMany({
      _id: { $in: destinationToDelete.attractions },
    });
  }

  await Destination.findByIdAndDelete(destinationToDelete._id);

  return {
    message: `Destinasi '${destinationToDelete.destinationTitle}' dan semua wahananya berhasil dihapus.`,
  };
};

export const search = async (searchTerm) => {
  if (
    !searchTerm ||
    typeof searchTerm !== 'string' ||
    searchTerm.trim() === ''
  ) {
    throw new ResponseError(400, 'Parameter pencarian tidak valid.');
  }

  /** Dapatkan aggregation pipeline dari helper */
  const pipeline = helper.searchDestination(searchTerm);

  const results = await Destination.aggregate(pipeline);
  return results;
};
