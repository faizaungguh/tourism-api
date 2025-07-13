import mongoose from 'mongoose';
import * as checker from '#validations/admin.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/adminPipeline.mjs';
import * as verify from '#helpers/manager.mjs';
import * as ensure from '#helpers/password.mjs';
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
  validate.isValidId(id);

  /** Cari manager berdasarkan id dan pastikan role-nya adalah 'manager' */
  const manager = await Admin.findOne({ _id: id, role: 'manager' }).select(
    '-password'
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

export const update = async (id, request) => {
  validate.isValidId(id);
  validate.isNotEmpty(request);

  /** validasi update */
  const validatedRequest = validate.requestCheck(
    checker.patchAdminValidation,
    request
  );

  /** Pastikan role tidak bisa diubah dari 'manager' */
  if (validatedRequest.role && validatedRequest.role !== 'manager') {
    throw new ResponseError(400, 'Menolak pengubahan role.', {
      message: 'role tidak dapat diubah',
    });
  }

  /** Cari manager berdasarkan id dan role, lalu ambil data aslinya */
  const originalManager = await Admin.findOne({
    _id: id,
    role: 'manager',
  }).select('+password');

  if (!originalManager) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  if (validatedRequest.oldPassword || validatedRequest.newPassword) {
    validatedRequest.password = await ensure.passwordUpdate(
      {
        oldPassword: validatedRequest.oldPassword,
        newPassword: validatedRequest.newPassword,
      },
      originalManager.password
    );
    delete validatedRequest.oldPassword;
    delete validatedRequest.newPassword;
  }

  await verify.checkDuplicate(validatedRequest, originalManager);

  const updatedAdmin = await Admin.findByIdAndUpdate(
    id,
    { $set: validatedRequest },
    { new: true }
  ).select('-password');

  return updatedAdmin.toObject();
};

export const drop = async (id) => {
  validate.isValidId(id);

  /** 1. Cek apakah manajer ini memiliki destinasi yang terkait */
  const destinationCount = await Destination.countDocuments({ createdBy: id });

  if (destinationCount > 0) {
    throw new ResponseError(409, 'Manajer memiliki destinasi wisata.', {
      message: `Tidak dapat menghapus manajer. Hapus ${destinationCount} destinasi yang terkait terlebih dahulu.`,
    });
  }

  /** 2. Jika tidak ada, lanjutkan proses penghapusan */
  const deletedManager = await Admin.findOneAndDelete({
    _id: id,
    role: 'manager',
  });

  if (!deletedManager) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  return deletedManager;
};
