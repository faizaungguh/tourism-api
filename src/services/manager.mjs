import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as check from '../validations/admin.mjs';
import { adminSchema } from '../schemas/admin.mjs';
import { validate } from '../validations/validate.mjs';
import { ResponseError } from '../errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const registerManager = async (request) => {
  /** validasi input */
  const validatedRequest = validate(check.adminValidation, request);

  /** cek duplikasi */
  const checkDuplicate = await Admin.find({
    $or: [
      { username: validatedRequest.username },
      { email: validatedRequest.email },
    ],
  }).select('username email');

  if (checkDuplicate.length > 0) {
    const duplicateErrors = {};
    checkDuplicate.forEach((admin) => {
      if (admin.username === validatedRequest.username) {
        duplicateErrors.username = 'Username telah terdaftar.';
      }
      if (admin.email === validatedRequest.email) {
        duplicateErrors.email = 'Email telah terdaftar.';
      }
    });

    if (Object.keys(duplicateErrors).length > 0) {
      throw new ResponseError(
        409,
        'Data yang diberikan sudah terdaftar.',
        duplicateErrors
      );
    }
  }

  /** hash password, untuk menyimpan dalam karakter acak */
  validatedRequest.password = await bcrypt.hash(validatedRequest.password, 10);

  /** role manager */
  validatedRequest.role = 'manager';

  /** jika betul, lanjut simpan */
  const newAdmin = new Admin(validatedRequest);
  const savedAdmin = await newAdmin.save();

  /** mengembalikan semua data kecuali password */
  const { password, ...result } = savedAdmin.toObject();
  return result;
};

export const getDetailManager = async (adminId) => {
  /** validasi */
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ResponseError(400, 'ID Manager tidak valid');
  }

  /** cari manager berdasarkan id */
  const admin = await Admin.findById(adminId).select('-password');

  /** jika manager tidak ditemukan, tampilkan pesan error */
  if (!admin) {
    throw new ResponseError(404, 'Manager tidak ditemukan');
  }

  /** kembalikan data manager */
  return admin.toObject();
};

export const updateManager = async (adminId, request) => {
  /** validasi update */
  const validatedRequest = validate(check.patchAdminValidation, request);

  /** cek apakah ada data yang dikirim */
  if (Object.keys(validatedRequest).length === 0) {
    throw new ResponseError(400, 'Tidak ada data yang dikirim untuk diubah');
  }

  const originalAdmin = await Admin.findById(adminId).select('+password');
  if (!originalAdmin) {
    throw new ResponseError(404, 'Manajer tidak ditemukan.');
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
    adminId,
    { $set: validatedRequest },
    { new: true }
  ).select('-password');

  return updatedAdmin.toObject();
};

export const deleteManager = async (adminId) => {
  if (!adminId) {
    throw new ResponseError(400, 'Anda perlu memasukkan Id Manajer');
  }

  /** validasi apakah id yang dikirimkan adalah object id yang valid */
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ResponseError(400, 'ID admin tidak valid');
  }

  /** cari dan hapus manager berdasarkan id */
  const admin = await Admin.findByIdAndDelete(adminId);

  /** jika admin tidak ditemukan, tampilkan pesan error */
  if (!admin) {
    throw new ResponseError(404, 'Manajer tidak ditemukan');
  }
};
