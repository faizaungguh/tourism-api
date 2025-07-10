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
    throw new ResponseError(400, 'ID admin tidak valid');
  }

  /** cari admin berdasarkan id */
  const admin = await Admin.findById(adminId).select('-password');

  /** jika admin tidak ditemukan, tampilkan pesan error */
  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan');
  }

  /** kembalikan data admin */
  return admin.toObject();
};

export const putManager = async (adminId, request) => {};

export const deleteManager = async (adminId) => {};
