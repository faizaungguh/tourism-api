import mongoose from 'mongoose';
import * as checker from '#validations/admin.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/adminPipeline.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);
const Destination = mongoose.model('Destination', destinationSchema);

export const getAll = async (query) => {
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
};

export const getDetail = async (id) => {
  /** Cari manager berdasarkan adminId dan pastikan role-nya adalah 'manager' */
  const manager = await Admin.findOne({ adminId: id, role: 'manager' }).select(
    '-_id -password -__v -createdAt -updatedAt'
  );

  /** Jika manager tidak ditemukan, tampilkan pesan error */
  if (!manager) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  /** kembalikan data manager */
  return manager.toObject();
};

export const update = async (id, adminId, request) => {
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
};

export const drop = async (id, adminId) => {
  if (id !== adminId) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Anda tidak diizinkan menghapus akun manajer lain.',
    });
  }

  const managerToDelete = await Admin.findOne({
    adminId: id,
    role: 'manager',
  })
    .select('_id')
    .lean();

  if (!managerToDelete) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  /** 1. Cek apakah manajer ini memiliki destinasi yang terkait */
  const destinationCount = await Destination.countDocuments({
    createdBy: managerToDelete._id,
  });

  if (destinationCount > 0) {
    throw new ResponseError(409, 'Manajer memiliki destinasi wisata.', {
      message: `Tidak dapat menghapus manajer. Hapus ${destinationCount} destinasi yang terkait terlebih dahulu.`,
    });
  }

  /** 2. Jika tidak ada, lanjutkan proses penghapusan */
  const deletedManager = await Admin.findOneAndDelete({
    adminId: id,
    role: 'manager',
  });

  if (!deletedManager) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  return deletedManager;
};
