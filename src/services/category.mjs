import mongoose from 'mongoose';
import * as validate from '../validations/validate.mjs';
import * as checker from '../validations/category.mjs';
import { categorySchema } from '../schemas/category.mjs';
import { ResponseError } from '../errors/responseError.mjs';

const Category = mongoose.model('Category', categorySchema);

export const createCategory = async (request) => {
  validate.isNotEmpty(request);
  /** validasi */
  const validatedRequest = validate.requestCheck(
    checker.categoryValidation,
    request
  );

  /** cek duplikasi nama kategori (case-insensitive) */
  const checkDuplicate = await Category.findOne({
    name: { $regex: new RegExp(`^${validatedRequest.name}$`, 'i') },
  });

  if (checkDuplicate) {
    throw new ResponseError(409, 'Duplikasi Kategori', {
      name: 'Kategori dengan nama yang sama sudah terdaftar.',
    });
  }

  /** Buat instance baru dari model Category */
  const data = new Category(validatedRequest);

  /** Simpan dokumen baru ke database */
  const savedCategory = await data.save();

  /** Kembalikan hasil yang sudah disimpan */
  return savedCategory.toObject();
};
