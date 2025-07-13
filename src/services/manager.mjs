import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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

  // Tambahkan filter di awal pipeline untuk hanya mengambil role 'manager'
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
    throw new ResponseError(400, 'Role manajer tidak dapat diubah.');
  }

  /** Cari manager berdasarkan id dan role, lalu ambil data aslinya (termasuk password) */
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
    if (!validatedRequest.oldPassword || !validatedRequest.newPassword) {
      throw new ResponseError(
        400,
        'Anda harus memasukkan password lama dan baru.'
      );
    }

    /** cocokkan password lama dengan yang ada di database */
    const isPasswordMatch = await bcrypt.compare(
      validatedRequest.oldPassword,
      originalManager.password
    );

    if (!isPasswordMatch) {
      throw new ResponseError(400, 'Password tidak sesuai', {
        oldPassword: 'Password lama yang Anda masukkan salah.',
      });
    }

    if (validatedRequest.newPassword === validatedRequest.oldPassword) {
      throw new ResponseError(
        400,
        'Password baru tidak boleh sama dengan password lama.',
        {
          newPassword: 'Password baru tidak boleh sama dengan yang lama.',
        }
      );
    }

    /** Jika cocok, hash password baru */
    validatedRequest.password = await bcrypt.hash(
      validatedRequest.newPassword,
      10
    );

    /** Hapus field sementara agar tidak tersimpan di database */
    delete validatedRequest.oldPassword;
    delete validatedRequest.newPassword;
  }

  /** cek duplikasi username / email */
  const orConditions = [];

  if (
    validatedRequest.username &&
    validatedRequest.username !== originalManager.username
  ) {
    orConditions.push({ username: validatedRequest.username });
  }

  if (
    validatedRequest.email &&
    validatedRequest.email !== originalManager.email
  ) {
    orConditions.push({ email: validatedRequest.email });
  }

  if (orConditions.length > 0) {
    const checkDuplicate = await Admin.findOne({ $or: orConditions });

    if (checkDuplicate) {
      const duplicateErrors = {};
      if (checkDuplicate.username === validatedRequest.username) {
        duplicateErrors.username =
          'Username ini sudah digunakan oleh akun lain.';
      }
      if (checkDuplicate.email === validatedRequest.email) {
        duplicateErrors.email = 'Email ini sudah digunakan oleh akun lain.';
      }
      throw new ResponseError(
        409,
        'Data yang diberikan sudah terdaftar.',
        duplicateErrors
      );
    }
  }

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
