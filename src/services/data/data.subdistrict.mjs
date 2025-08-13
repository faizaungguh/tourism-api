import { validations } from '#validations/validation.mjs';
import { checker } from '#validations/checker.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const subdistrictData = {
  post: async (request) => {
    /** validasi request */
    validations.check.isNotEmpty(request);

    const validatedRequest = validations.check.request(checker.subdistrict.create, request);

    /** ambil data yang telah valid */
    const data = new Subdistrict(validatedRequest);

    /** Simpan ke database */
    const savedSubdistrict = await data.save();

    /** kembalikan hasil yang telah dsiimpan */
    return {
      name: savedSubdistrict.name,
      code: savedSubdistrict.code,
    };
  },

  list: async (query) => {
    /** validasi */
    const validatedQuery = validations.check.request(checker.subdistrict.list, query);
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
    validations.check.isNotEmpty(request);

    const validatedRequest = validations.check.request(checker.subdistrict.update, request);

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
