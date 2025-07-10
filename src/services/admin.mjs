import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { adminValidation } from '../validations/admin.mjs';
import { adminSchema } from '../schemas/admin.mjs';
import { ResponseError } from '../errors/responseError.mjs';
import { validate } from '../validations/validate.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const createAdmin = async (request) => {
  /** validasi input menggunakan validate */
  const validatedRequest = validate(adminValidation, request);

  /** eck duplikasi username dan email */
  const checkDuplicate = await Admin.find({
    $or: [
      { username: validatedRequest.username },
      { email: validatedRequest.email },
    ],
  }).select('username email');

  /** munculkan pesan error jika ditemui duplikasi */
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

  /** secara otomatis atur role menjadi 'admin' */
  validatedRequest.role = 'admin';

  /** jika betul, lanjut simpan */
  const newAdmin = new Admin(validatedRequest);
  const savedAdmin = await newAdmin.save();

  /** mengembalikan semua data kecuali password */
  const { password, ...result } = savedAdmin.toObject();
  return result;
};
