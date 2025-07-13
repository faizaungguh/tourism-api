import mongoose from 'mongoose';
import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/subdistrict.mjs';
import { SubdistrictSchema } from '#schemas/subdistrict.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Subdistrict = mongoose.model('Subdistrict', SubdistrictSchema);

export const createSubdistrict = async (request) => {
  /** validasi request */
  validate.isNotEmpty(request);

  const validatedRequest = validate.requestCheck(
    checker.subdistrictValidation,
    request
  );

  /** cek duplikasi nama kecamatan */
  const checkDuplicate = await Subdistrict.findOne({
    name: { $regex: new RegExp(`^${validatedRequest.name}$`, 'i') },
  });

  if (checkDuplicate) {
    throw new ResponseError(409, 'Duplikasi Kecamatan', {
      name: 'Kecamatan dengan nama yang sama sudah terdaftar.',
    });
  }

  /** ambil data yang telah valid */
  const data = new Subdistrict(validatedRequest);

  /** Simpan ke database */
  const savedSubdistrict = await data.save();

  /** kembalikan hasil yang telah dsiimpan */
  return savedSubdistrict.toObject();
};

export const getAllSubdistrict = async (query) => {
  /** validasi */
  const validatedQuery = validate.requestCheck(
    checker.listSubdistrictValidation,
    query
  );
  const { page, size, sort, sortBy } = validatedQuery;
  const skip = (page - 1) * size;

  /** pengurutan ascending atau descending */
  const sortDirection = sort === 'asc' ? 1 : -1;

  /** Opsi pengurutan dinamis berdasarkan sortBy */
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortDirection;
  } else {
    sortOptions.createdAt = sortDirection;
  }

  /** filter */
  const filter = {};

  const [totalItems, subdistricts] = await Promise.all([
    Subdistrict.countDocuments(filter),
    Subdistrict.find(filter).sort(sortOptions).skip(skip).limit(size),
  ]);

  return {
    result: subdistricts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / size),
      totalItems,
      size,
    },
  };
};

export const updateSubdistrict = async (id, request) => {
  validate.isValidId(id);
  validate.isNotEmpty(request);

  const validatedRequest = validate.requestCheck(
    checker.subdistrictValidation,
    request
  );

  const subdistrict = await Subdistrict.findById(id);
  if (!subdistrict) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Kecamatan dengan id ${id} tidak ditemukan`,
    });
  }

  /** cek duplikasi if name is changed */
  if (validatedRequest.name.toLowerCase() !== subdistrict.name.toLowerCase()) {
    const checkDuplicate = await Subdistrict.findOne({
      name: { $regex: new RegExp(`^${validatedRequest.name}$`, 'i') },
      _id: { $ne: id },
    });
    if (checkDuplicate) {
      throw new ResponseError(409, 'Duplikasi Kecamatan', {
        name: 'Kecamatan dengan nama yang sama sudah terdaftar.',
      });
    }
  }

  subdistrict.name = validatedRequest.name;
  const result = await subdistrict.save();

  return result;
};

export const deleteSubdistrict = async (id) => {
  validate.isValidId(id);

  /** cek id */
  const isAvailable = await Subdistrict.findById(id);

  if (!isAvailable) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Kecamatan dengan Id ${id} tidak ditemukan`,
    });
  }

  /** cari id dan hapus */
  await Subdistrict.findByIdAndDelete(id);

  return {
    message: `Kecamatan dengan berhasil dihapus.`,
  };
};
