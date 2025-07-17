import * as checker from '#validations/admin.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/adminPipeline.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const adminService = {
  create: async (request) => {
    validate.isNotEmpty(request);

    /** Validasi input request. */
    const validatedRequest = validate.requestCheck(
      checker.adminValidation,
      request
    );

    const newAdmin = await helper.createAdmin(validatedRequest);

    if (!newAdmin) {
      throw new ResponseError(500, 'Gagal membuat admin');
    }
    return newAdmin;
  },

  getAll: async (query) => {
    /** validasi dan ambil nilai default dari query */
    const validatedQuery = validate.requestCheck(
      checker.listAdminValidation,
      query
    );

    /** Dapatkan aggregation pipeline dari helper */
    const pipeline = helper.listAdmins(validatedQuery);

    const result = await Admin.aggregate(pipeline);

    const data = result[0].data;
    const totalItems = result[0].metadata[0]
      ? result[0].metadata[0].totalItems
      : 0;

    const { page, size } = validatedQuery;

    return {
      result: data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / size),
        totalItems,
        size,
      },
    };
  },

  getDetail: async (id) => {
    /** cari admin berdasarkan adminId */
    const admin = await Admin.findOne({ adminId: id }).select('-password -__v');

    /** jika admin tidak ditemukan, tampilkan pesan error */
    if (!admin) {
      throw new ResponseError(404, 'Id tidak ditemukan', {
        message: `Admin dengan Id ${id} tidak ditemukan`,
      });
    }

    /** kembalikan data admin */
    return admin;
  },

  update: async (id, request) => {
    /** cek apakah ada data yang dikirim */
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(
      checker.patchAdminValidation,
      request
    );

    const updatedAdmin = await helper.updateAdmin(id, validatedRequest);

    return updatedAdmin;
  },

  drop: async (id) => {
    /** cari adminId dan hapus, lalu kembalikan dokumen yang dihapus */
    const deletedAdmin = await Admin.findOneAndDelete({ adminId: id });

    if (!deletedAdmin) {
      throw new ResponseError(404, 'Id tidak ditemukan', {
        message: `Admin dengan Id ${id} tidak ditemukan`,
      });
    }

    return deletedAdmin;
  },
};
