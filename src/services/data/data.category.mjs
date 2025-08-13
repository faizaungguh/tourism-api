import { validations } from '#validations/validation.mjs';
import { checker } from '#validations/checker.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Category } from '#schemas/category.mjs';

export const categoryData = {
  post: async (request) => {
    /** validasi request */
    validations.check.isNotEmpty(request);

    const validatedRequest = validations.check.request(checker.category.create, request);

    /** Buat instance baru dari model Category */
    const data = new Category(validatedRequest);

    /** Simpan dokumen baru ke database */
    const savedCategory = await data.save();

    /** Kembalikan hasil yang sudah disimpan */
    return {
      name: savedCategory.name,
    };
  },

  list: async (query) => {
    /** validasi */
    const validatedQuery = validations.check.request(checker.category.list, query);
    const { page, size, sort } = validatedQuery;
    const skip = (page - 1) * size;

    /** pengurutan ascending atau descending */
    const sortDirection = sort === 'asc' ? 1 : -1;

    /** filter */
    const filter = {};

    const [totalItems, categories] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter).sort({ createdAt: sortDirection }).skip(skip).limit(size),
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

  update: async (slug, request) => {
    const validatedRequest = validations.check.request(checker.category.update, request);

    const originalCategory = await Category.findOne({ slug });
    if (!originalCategory) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kategori ${slug} tidak ditemukan`,
      });
    }

    const result = await Category.findOneAndUpdate(
      { slug: slug },
      {
        $set: validatedRequest,
      },
      { new: true },
    );

    return result;
  },

  drop: async (slug) => {
    /** Cek apakah kategori ada */
    const categoryToDelete = await Category.findOne({ slug });

    if (!categoryToDelete) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kategori ${slug} tidak ditemukan`,
      });
    }

    /** cari slug dan hapus */
    await Category.deleteOne({ slug: slug });
  },
};
