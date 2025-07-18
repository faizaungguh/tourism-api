import mongoose from 'mongoose';
import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/category.mjs';
import { categorySchema } from '#schemas/category.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Category = mongoose.model('Category', categorySchema);
const Destination = mongoose.model('Destination', destinationSchema);

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

  updateCategory: async (slug, request) => {
    /** cek req.body nya */
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(
      checker.categoryValidation,
      request
    );

    const originalCategory = await Category.findOne({ slug: slug });
    if (!originalCategory) {
      throw new ResponseError(404, 'Id tidak ditemukan', {
        message: `Kategori dengan slug ${slug} tidak ditemukan`,
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

    const result = await Category.findOneAndUpdate(
      { slug: slug },
      {
        $set: validatedRequest,
      },
      { new: true }
    ).select('-_id -__v -createdAt -updatedAt');

    return result;
  },

  deleteCategory: async (slug) => {
    /** cek id */
    const categoryToDelete = await Category.findOne({ slug });
    console.log(categoryToDelete._id);
    if (!categoryToDelete) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kategori ${slug} tidak ditemukan`,
      });
    }

    /** Cek apakah kategori ini masih digunakan oleh destinasi lain */
    const destinationCount = await Destination.countDocuments({
      category: categoryToDelete._id,
    });

    if (destinationCount > 0) {
      throw new ResponseError(
        409,
        'Kategori masih digunakan oleh destinasi lain.',
        {
          message: `Tidak dapat menghapus kategori. Hapus ${destinationCount} destinasi yang terkait terlebih dahulu.`,
        }
      );
    }

    /** cari slug dan hapus */
    await Category.findOneAndDelete({ slug: slug });
  },
};
