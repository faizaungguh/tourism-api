import mongoose from 'mongoose';
import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/attraction.mjs';
import { attractionSchema } from '#schemas/attraction.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { adminSchema } from '#schemas/admin.mjs';

const Attraction = mongoose.model('Attraction', attractionSchema);
const Destination = mongoose.model('Destination', destinationSchema);
const Admin = mongoose.model('Admin', adminSchema);

export const create = async (adminId, destinationSlug, request) => {
  validate.isNotEmpty(request);

  /** 1. Otorisasi: Pastikan admin adalah manajer dan pemilik destinasi */
  if (!adminId) {
    throw new ResponseError(401, 'Unauthorized', {
      message: 'Admin ID diperlukan untuk otorisasi.',
    });
  }

  const admin = await Admin.findOne({ adminId }).select('_id role').lean();

  if (!admin || admin.role !== 'manager') {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Hanya manajer yang dapat menambahkan wahana wisata.',
    });
  }

  const destination = await Destination.findOne({ slug: destinationSlug })
    .select('_id createdBy')
    .lean();

  if (!destination) {
    throw new ResponseError(404, 'Destinasi tidak ditemukan', {
      message: `Destinasi dengan slug '${destinationSlug}' tidak ditemukan.`,
    });
  }

  if (destination.createdBy.toString() !== admin._id.toString()) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message:
        'Anda tidak memiliki izin untuk menambahkan wahana ke destinasi ini.',
    });
  }

  /** 2. Validasi request body */
  const validatedRequest = validate.requestCheck(
    checker.createAttractionValidation,
    request
  );

  /** 3. Cek duplikasi nama wahana di dalam destinasi yang sama */
  const existingAttraction = await Attraction.findOne({
    name: validatedRequest.name,
    destination: destination._id,
  }).select('name');

  if (existingAttraction) {
    throw new ResponseError(409, 'Nama wahana sudah ada di destinasi ini.', {
      name: `Wahana dengan nama '${validatedRequest.name}' sudah terdaftar.`,
    });
  }

  /** 4. Siapkan dan simpan data */
  validatedRequest.destination = destination._id;

  const newAttraction = new Attraction(validatedRequest);
  const savedAttraction = await newAttraction.save();

  await Destination.updateOne(
    { _id: destination._id },
    { $push: { attractions: savedAttraction._id } }
  );

  return savedAttraction.toObject();
};

export const list = async () => {};

export const getDetail = async () => {};
