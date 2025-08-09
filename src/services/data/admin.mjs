import * as checker from '#validations/admin.mjs';
import * as validate from '#validations/validate.mjs';
import { adminHelper } from '#helpers/data/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';

export const adminService = {
  post: async (request) => {
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(checker.adminValidation, request);

    validatedRequest.role = 'admin';

    return Admin.create(validatedRequest);
  },

  list: async (query) => {
    /** validasi dan ambil nilai default dari query */
    const validatedQuery = validate.requestCheck(checker.listAdminValidation, query);

    /** Dapatkan aggregation pipeline dari helper */
    const pipeline = adminHelper.listAdmins(validatedQuery);

    const result = await Admin.aggregate(pipeline);

    const data = result[0].data;
    const totalItems = result[0].metadata[0] ? result[0].metadata[0].totalItems : 0;

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

  detail: async (id) => {
    /** cari admin berdasarkan adminId */
    const admin = await Admin.findOne({ adminId: id });

    /** jika admin tidak ditemukan, tampilkan pesan error */
    if (!admin) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Admin dengan Id ${id} tidak ditemukan`,
      });
    }

    if (admin.photo) {
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const photoPath = admin.photo.replace(/\\/g, '/');

      admin.photo = new URL(photoPath, baseUrl).href;
    }

    /** kembalikan data admin */
    return admin;
  },

  update: async (id, request) => {
    /** cek apakah ada data yang dikirim */
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(checker.patchAdminValidation, request);

    const updatedAdmin = await adminHelper.updateAdmin(id, validatedRequest);

    return updatedAdmin;
  },

  drop: async (id) => {
    /** cari adminId dan hapus, lalu kembalikan dokumen yang dihapus */
    const deletedAdmin = await Admin.findOneAndDelete({ adminId: id });

    if (!deletedAdmin) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Admin dengan Id ${id} tidak ditemukan`,
      });
    }

    return deletedAdmin;
  },
};
