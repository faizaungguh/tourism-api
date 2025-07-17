import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as validate from '#validations/validate.mjs';
import { validation } from '#validations/auth.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { config } from '#configs/variable.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const authService = {
  registerManager: async (request) => {
    validate.isNotEmpty(request);
    /** validasi input */
    const validatedRequest = validate.requestCheck(
      validation.register,
      request
    );

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
    validatedRequest.password = await bcrypt.hash(
      validatedRequest.password,
      10
    );

    /** role manager */
    validatedRequest.role = 'manager';

    /** jika betul, lanjut simpan */
    const newAdmin = new Admin(validatedRequest);
    const savedAdmin = await newAdmin.save();

    /** mengembalikan semua data kecuali password */
    const { password, ...result } = savedAdmin.toObject();
    return result;
  },

  signIn: async (request) => {
    const loginRequest = validate.requestCheck(validation.login, request);

    const admin = await Admin.findOne({ username: loginRequest.username });

    if (!admin) {
      throw new ResponseError(401, 'Anda tidak bisa login', {
        username: 'username salah',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginRequest.password,
      admin.password
    );

    if (!isPasswordValid) {
      throw new ResponseError(401, 'Anda tidak bisa login.', {
        password: 'Password yang Anda masukkan salah.',
      });
    }

    const payload = {
      id: admin.adminId,
      role: admin.role,
    };

    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });
    return { token, ...payload };
  },
};
