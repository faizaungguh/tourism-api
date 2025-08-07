import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/subdistrict.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const subdistrictService = {
  post: async (request) => {
    /** validasi request */
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(checker.subdistrictValidation, request);

    /** ambil data yang telah valid */
    const data = new Subdistrict(validatedRequest);

    /** Simpan ke database */
    const savedSubdistrict = await data.save();

    /** kembalikan hasil yang telah dsiimpan */
    return savedSubdistrict.toObject();
  },

  list: async (query) => {
    /** validasi */
    const validatedQuery = validate.requestCheck(checker.listSubdistrictValidation, query);
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
  },

  update: async (slug, request) => {
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(checker.subdistrictValidation, request);

    const originalSubdistrict = await Subdistrict.findOne({ slug });
    if (!originalSubdistrict) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kecamatan ${slug} tidak ditemukan`,
      });
    }

    originalSubdistrict.set(validatedRequest);
    const result = await originalSubdistrict.save();

    return result;
  },

  drop: async (slug) => {
    const deletedSubdistrict = await Subdistrict.deleteOne({ slug });

    if (!deletedSubdistrict) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kecamatan dengan slug '${slug}' tidak ditemukan`,
      });
    }

    return;
  },
};
