import mongoose from 'mongoose';
import * as checker from '#validations/destination.mjs';
import * as validate from '#validations/validate.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { categorySchema } from '#schemas/category.mjs';
import { SubdistrictSchema } from '#schemas/subdistrict.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { allDestinationPipeline } from '#helpers/destinationPipeline.mjs';

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
  const pipeline = allDestinationPipeline(validatedQuery);

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

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'categories',
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
    { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
    {
      $unwind: {
        path: '$subdistrictDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    { $unwind: { path: '$adminDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
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
      },
    },
  ];

  const result = await Destination.aggregate(pipeline);

  return result[0] || null;
};

export const getDetailSlug = async (slug) => {};

export const updateDestination = async (id, request) => {};

export const deleteDestination = async (id) => {};
