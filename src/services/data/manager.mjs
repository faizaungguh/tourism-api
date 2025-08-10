import * as checker from '#validations/data/admin.mjs';
import { validate } from '#validations/validate.mjs';
import { helper } from '#helpers/helper.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';

export const managerService = {
  list: async (query) => {
    const validatedQuery = validate.check.request(checker.listAdminValidation, query);

    const pipeline = helper.Data.admin.list(validatedQuery);

    pipeline.unshift({ $match: { role: 'manager' } });

    const result = await Admin.aggregate(pipeline);

    const data = result[0]?.data || [];
    const totalItems = result[0]?.metadata[0] ? result[0].metadata[0].totalItems : 0;

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
    /** Cari manager berdasarkan adminId dan pastikan role-nya adalah 'manager' */
    const manager = await Admin.findOne({
      adminId: id,
      role: 'manager',
    });

    /** Jika manager tidak ditemukan, tampilkan pesan error */
    if (!manager) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Manajer dengan Id ${id} tidak ditemukan`,
      });
    }

    if (manager.photo) {
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const photoPath = manager.photo.replace(/\\/g, '/');

      manager.photo = new URL(photoPath, baseUrl).href;
    }

    /** kembalikan data manager */
    return manager;
  },

  update: async (id, admin, request) => {
    validate.check.isNotEmpty(request);

    /** validasi update */
    const validatedRequest = validate.check.request(checker.patchAdminValidation, request);

    const updatedManager = await helper.Data.manager.update(id, admin.adminId, validatedRequest);

    return updatedManager;
  },

  drop: async (adminId) => {
    const manager = await Admin.findOne({
      adminId: adminId,
      role: 'manager',
    });

    if (!manager) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Manajer dengan Id ${adminId} tidak ditemukan`,
      });
    }

    await manager.deleteOne();

    return manager;
  },
};
