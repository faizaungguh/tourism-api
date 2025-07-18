import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/subdistrict.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const subdistrictService = {
  createSubdistrict: async (request) => {
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
  },

  getAllSubdistrict: async (query) => {
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
  },

  updateSubdistrict: async (slug, request) => {
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(
      checker.subdistrictValidation,
      request
    );

    const originalSubdistrict = await Subdistrict.findOne({ slug });
    if (!originalSubdistrict) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kecamatan ${slug} tidak ditemukan`,
      });
    }

    /** cek duplikasi if name is changed */
    const isNameChanged =
      validatedRequest.name &&
      validatedRequest.name.toLowerCase() !==
        originalSubdistrict.name.toLowerCase();

    if (isNameChanged) {
      const checkDuplicate = await Subdistrict.findOne({
        name: { $regex: new RegExp(`^${validatedRequest.name}$`, 'i') },
        _id: { $ne: originalSubdistrict._id },
      });
      if (checkDuplicate) {
        throw new ResponseError(409, 'Duplikasi nama kecamatan', {
          name: 'Kecamatan dengan nama yang sama sudah terdaftar.',
        });
      }
    }

    originalSubdistrict.set(validatedRequest);
    const result = await originalSubdistrict.save();

    return result;
  },

  deleteSubdistrict: async (slug) => {
    const deletedSubdistrict = await Subdistrict.findOneAndDelete({ slug });

    if (!deletedSubdistrict) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Kecamatan dengan slug '${slug}' tidak ditemukan`,
      });
    }

    return;
  },
};
