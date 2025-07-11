import mongoose from 'mongoose';
import * as validate from '../validations/validate.mjs';
import * as checker from '../validations/subdistrict.mjs';
import { SubdistrictSchema } from '../schemas/subdistrict.mjs';
import { ResponseError } from '../errors/responseError.mjs';

const Subdistrict = mongoose.model('Subdisctrict', SubdistrictSchema);

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
  const { page, size, sort } = validatedQuery;
  const skip = (page - 1) * size;

  /** pengurutan ascending atau descending */
  const sortDirection = sort === 'asc' ? 1 : -1;

  /** filter */
  const filter = {};

  const [totalItems, subdistricts] = await Promise.all([
    Subdistrict.countDocuments(filter),
    Subdistrict.find(filter)
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(size),
  ]);

  return {
    data: subdistricts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / size),
      totalItems,
      size,
    },
  };
};

export const updateSubdistrict = async (id, request) => {};

export const deleteSubdistrict = async (id) => {};
