import mongoose from 'mongoose';
import * as checker from '#validations/admin.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/adminPipeline.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const managerService = {
  getAll: async (query) => {
    const validatedQuery = validate.requestCheck(
      checker.listAdminValidation,
      query
    );

    const pipeline = helper.listAdmins(validatedQuery);

    pipeline.unshift({ $match: { role: 'manager' } });

    const result = await Admin.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalItems = result[0]?.metadata[0]
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
    /** Cari manager berdasarkan adminId dan pastikan role-nya adalah 'manager' */
    const manager = await Admin.findOne({
      adminId: id,
      role: 'manager',
    }).select('-_id -password -__v -createdAt -updatedAt');

    /** Jika manager tidak ditemukan, tampilkan pesan error */
    if (!manager) {
      throw new ResponseError(404, 'Id tidak ditemukan', {
        message: `Manajer dengan Id ${id} tidak ditemukan`,
      });
    }

    /** kembalikan data manager */
    return manager.toObject();
  },

  update: async (id, adminId, request) => {
    if (!adminId) {
      throw new ResponseError(401, 'Otorisasi Gagal', {
        message:
          'adminId dari pengguna yang melakukan perubahan harus disertakan di body request.',
      });
    }

    const updatePayload = { ...request };
    delete updatePayload.adminId;

    validate.isNotEmpty(updatePayload);

    /** validasi update */
    const validatedRequest = validate.requestCheck(
      checker.patchAdminValidation,
      updatePayload
    );

    const updatedManager = await helper.updateManager(
      id,
      adminId,
      validatedRequest
    );

    return updatedManager;
  },

  drop: async (adminId) => {
    const deletedManager = await helper.dropManager(adminId);
    return deletedManager;
  },
};
