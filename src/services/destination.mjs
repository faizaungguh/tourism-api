import mongoose from 'mongoose';
import * as checker from '#validations/destination.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/destinationPipeline.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { categorySchema } from '#schemas/category.mjs';
import { SubdistrictSchema } from '#schemas/subdistrict.mjs';
import { adminSchema } from '#schemas/admin.mjs';

const Destination = mongoose.model('Destination', destinationSchema);
const Category = mongoose.model('Category', categorySchema);
const Subdistrict = mongoose.model('Subdistrict', SubdistrictSchema);
const Admin = mongoose.model('Admin', adminSchema);

export const createDestination = async (request) => {
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

  // Ganti nama field `adminId` menjadi `createdBy` dan simpan _id admin
  validatedRequest.createdBy = admin._id;
  delete validatedRequest.adminId;

  const newDestination = new Destination(validatedRequest);
  const savedDestination = await newDestination.save();

  /** kembalikan data yang sudah disimpan */
  return savedDestination;
};

export const getAllDestination = async (query) => {
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

export const getDetailDestination = async (id) => {
  /** Validasi ID */
  validate.isValidId(id);

  const destinationExists = await Destination.findById(id).select('_id').lean();
  if (!destinationExists) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan.');
  }

  /** Dapatkan aggregation pipeline dari helper */
  const pipeline = helper.getDestination(id);

  const result = await Destination.aggregate(pipeline);

  return result[0] || null;
};

export const getDetailSlug = async (categorySlug, destinationSlug) => {
  if (!categorySlug || typeof categorySlug !== 'string') {
    throw new ResponseError(400, 'Category slug tidak valid.');
  }
  if (!destinationSlug || typeof destinationSlug !== 'string') {
    throw new ResponseError(400, 'Destination slug tidak valid.');
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

export const updateDestination = async (id, adminId, request) => {
  // 1. Validasi dasar
  validate.isValidId(id);
  validate.isNotEmpty(request);

  if (!adminId) {
    throw new ResponseError(401, 'Unauthorized', {
      message: 'Admin ID diperlukan untuk otorisasi.',
    });
  }

  // 2. Otorisasi: Hanya manajer ('mng-') yang bisa lanjut
  if (!adminId.startsWith('mng-')) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Hanya manajer yang dapat mengubah destinasi.',
    });
  }

  // 3. Cek kepemilikan (Ownership)
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

  // 4. Validasi request body
  const validatedRequest = validate.requestCheck(
    checker.patchDestinationValidation,
    request
  );

  // 5. Cek keunikan destinationTitle jika diubah
  if (
    validatedRequest.destinationTitle &&
    validatedRequest.destinationTitle !== destinationToUpdate.destinationTitle
  ) {
    const existingDestination = await Destination.findOne({
      destinationTitle: validatedRequest.destinationTitle,
      _id: { $ne: id }, // Pastikan tidak sama dengan ID destinasi saat ini
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
    // Jika judul sama, tidak perlu diubah. Hapus dari objek update.
    delete validatedRequest.destinationTitle;
    // Jika hanya destinationTitle yang dikirim dan itu sama, maka tidak ada yang diupdate.
    if (Object.keys(validatedRequest).length === 0) {
      const pipeline = helper.getDestination(id);
      const result = await Destination.aggregate(pipeline);
      return result[0];
    }
  }

  // 6. Handle relasi (Kategori & Kecamatan) jika ada di request
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

  // 7. Lakukan update
  await Destination.findByIdAndUpdate(id, { $set: validatedRequest });

  // 8. Ambil dan kembalikan data terbaru yang sudah di-populate
  const pipeline = helper.getDestination(id);
  const result = await Destination.aggregate(pipeline);

  return result[0];
};

export const deleteDestination = async (id, adminId) => {
  // 1. Validasi dasar
  validate.isValidId(id);

  if (!adminId) {
    throw new ResponseError(401, 'Unauthorized', {
      message: 'Admin ID diperlukan untuk otorisasi.',
    });
  }

  // 2. Otorisasi: Hanya manajer ('mng-') yang bisa lanjut
  if (!adminId.startsWith('mng-')) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Hanya manajer yang dapat menghapus destinasi.',
    });
  }

  // 3. Cek kepemilikan (Ownership)
  const [admin, destinationToDelete] = await Promise.all([
    Admin.findOne({ adminId }).select('_id').lean(),
    Destination.findById(id).select('createdBy destinationTitle').lean(),
  ]);

  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan.', {
      adminId: `Admin dengan ID "${adminId}" tidak ditemukan.`,
    });
  }

  if (!destinationToDelete) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan.', {
      id: `Destinasi dengan ID "${id}" tidak ditemukan.`,
    });
  }

  if (destinationToDelete.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Anda tidak memiliki izin untuk menghapus destinasi ini.',
    });
  }

  // 4. Lakukan penghapusan
  await Destination.findByIdAndDelete(id);

  // 5. Kembalikan pesan sukses
  return {
    message: `Destinasi '${destinationToDelete.destinationTitle}' berhasil dihapus.`,
  };
};
