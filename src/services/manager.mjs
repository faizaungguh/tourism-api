import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as checker from '../validations/admin.mjs';
import * as validate from '../validations/validate.mjs';
import { adminSchema } from '../schemas/admin.mjs';
import { ResponseError } from '../errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const getDetailManager = async (id) => {
  validate.isValidId(id);

  /** cari manager berdasarkan id */
  const admin = await Admin.findById(id).select('-password');

  /** jika manager tidak ditemukan, tampilkan pesan error */
  if (!admin) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  /** kembalikan data manager */
  return admin.toObject();
};

export const updateManager = async (id, request) => {
  validate.isValidId(id);

  /** cek apakah ada data yang dikirim */
  validate.isNotEmpty(request);

  /** validasi update */
  const validatedRequest = validate.requestCheck(
    checker.patchAdminValidation,
    request
  );

  const originalAdmin = await Admin.findById(id).select('+password');
  if (!originalAdmin) {
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
      originalAdmin.password
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
    validatedRequest.username !== originalAdmin.username
  ) {
    orConditions.push({ username: validatedRequest.username });
  }

  if (
    validatedRequest.email &&
    validatedRequest.email !== originalAdmin.email
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

export const deleteManager = async (id) => {
  validate.isValidId(id);

  /** cek id */
  const isAvailable = await Category.findById(id);

  if (!isAvailable) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Kategori dengan Id ${id} tidak ditemukan`,
    });
  }

  /** cari id dan hapus */
  await Category.findByIdAndDelete(id);

  return {
    message: 'Kategori dengan berhasil dihapus.',
  };
};
