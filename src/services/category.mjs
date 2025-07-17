import mongoose from 'mongoose';
import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/category.mjs';
import { categorySchema } from '#schemas/category.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Category = mongoose.model('Category', categorySchema);

export const categoryService = {
  createCategory: async (request) => {
    /** validasi request */
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(
      checker.categoryValidation,
      request
    );

    /** cek duplikasi nama kategori */
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
  },

  getAllCategory: async (query) => {
    /** validasi */
    const validatedQuery = validate.requestCheck(
      checker.listCategoryValidation,
      query
    );
    const { page, size, sort } = validatedQuery;
    const skip = (page - 1) * size;

    /** pengurutan ascending atau descending */
    const sortDirection = sort === 'asc' ? 1 : -1;

    /** filter */
    const filter = {};

    const [totalItems, categories] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter)
        .sort({ createdAt: sortDirection })
        .skip(skip)
        .limit(size),
    ]);

    return {
      result: categories,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / size),
        totalItems,
        size,
      },
    };
  },

  updateCategory: async (id, request) => {
    /** validasi */
    validate.isValidId(id);

    /** cek req.body nya */
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(
      checker.categoryValidation,
      request
    );

    const originalCategory = await Category.findById(id);
    if (!originalCategory) {
      throw new ResponseError(404, 'Id tidak ditemukan', {
        message: `Kategori dengan id ${id} tidak ditemukan`,
      });
    }

    /** cek duplikasi */
    if (
      validatedRequest.name.toLowerCase() !==
      originalCategory.name.toLowerCase()
    ) {
      const checkDuplicate = await Category.findOne({
        name: { $regex: new RegExp(`^${validatedRequest.name}$`, 'i') },
      });
      if (checkDuplicate) {
        throw new ResponseError(409, 'Duplikasi Kategori', {
          name: 'Kategori dengan nama yang sama sudah terdaftar.',
        });
      }
    }

    const result = await Category.findByIdAndUpdate(
      id,
      {
        $set: validatedRequest,
      },
      { new: true }
    );

    return result;
  },

  deleteCaegory: async (id) => {
    validate.isValidId(id);

    /** cek id */
    const isAvailable = await Category.findById(id);

    if (!isAvailable) {
      throw new ResponseError(404, 'Id tidak ditemukan', {
        message: `Kategori dengan Id ${id} tidak ditemukan`,
      });
    }

    /** cari id dan hapus */
    await Category.findByIdAndDelete(id);

    return {
      message: `Kategori dengan berhasil dihapus.`,
    };
  },
};
