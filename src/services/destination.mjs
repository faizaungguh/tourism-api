import mongoose from 'mongoose';
import * as checker from '#validations/destination.mjs';
import * as validate from '#validations/validate.mjs';
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
  const { page, size, sort, sortBy, search, category, subdistrict } =
    validatedQuery;
  const skip = (page - 1) * size;
  const sortDirection = sort === 'asc' ? 1 : -1;

  /** Tahap $match untuk filtering */
  const andClauses = [];
  if (search) {
    andClauses.push({ destinationTitle: { $regex: search, $options: 'i' } });
  }
  if (category) {
    /** filter berdasarkan nama kategori atau slug-nya */
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

  /** Opsi pengurutan dinamis berdasarkan sortBy */
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

  /** Aggregation Pipeline */
  const pipeline = [
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
    { $unwind: '$categoryDetails' },
    { $unwind: '$subdistrictDetails' },
    /** Tambahkan tahap $match hanya jika ada kriteria filter */
    ...(andClauses.length > 0 ? [{ $match: { $and: andClauses } }] : []),
    {
      $facet: {
        metadata: [{ $count: 'totalItems' }],
        data: [
          { $sort: sortStage },
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

  const result = await Destination.aggregate(pipeline);

  const data = result[0].data;
  const totalItems = result[0].metadata[0]
    ? result[0].metadata[0].totalItems
    : 0;

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
export const getDetailDestination = async (id) => {};

export const updateDestination = async (id, request) => {};

export const deleteDestination = async (id) => {};
