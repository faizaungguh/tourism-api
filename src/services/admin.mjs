import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as check from '../validations/admin.mjs';
import { validate } from '../validations/validate.mjs';
import { adminSchema } from '../schemas/admin.mjs';
import { ResponseError } from '../errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const createAdmin = async (request) => {
  /** validasi input menggunakan validate */
  const validatedRequest = validate(check.adminValidation, request);

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

export const getAllAdmin = async (query) => {
  /** validasi dan ambil nilai default dari query */
  const validatedQuery = validate(check.listAdminValidation, query);
  const { page, size, sort, role } = validatedQuery;
  const skip = (page - 1) * size;

  /** pengurutan ascending atau descending */
  const sortDirection = sort === 'asc' ? 1 : -1;

  /** buat filter berdasarkan role jika ada */
  const filter = {};
  if (role) {
    filter.role = role;
  }

  /** query ke mongodb */
  const [totalItems, admins] = await Promise.all([
    Admin.countDocuments(filter),
    Admin.find(filter)
      .select('-password')
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(size),
  ]);

  return {
    data: admins,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalItems / size),
      totalItems,
      size,
    },
  };
};

export const getDetailAdmin = async (adminId) => {
  /** validasi apakah id yang dikirimkan adalah object id yang valid */
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

export const updateAdmin = async (adminId, request) => {
  /** validasi update */
  const validatedRequest = validate(check.patchAdminValidation, request);

  /** cek apakah ada data yang dikirim */
  if (Object.keys(validatedRequest).length === 0) {
    throw new ResponseError(400, 'Tidak ada data yang dikirim untuk diubah');
  }

  const originalAdmin = await Admin.findById(adminId).select('+password');
  if (!originalAdmin) {
    throw new ResponseError(404, 'Admin tidak ditemukan.');
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

export const deleteAdmin = async (adminId) => {
  if (!adminId) {
    throw new ResponseError(400, 'Anda perlu memasukan Id Admin');
  }
  /** validasi apakah id yang dikirimkan adalah object id yang valid */
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ResponseError(400, 'ID admin tidak valid');
  }

  /** cari dan hapus admin berdasarkan id */
  const admin = await Admin.findByIdAndDelete(adminId);

  /** jika admin tidak ditemukan, tampilkan pesan error */
  if (!admin) {
    throw new ResponseError(404, 'Admin tidak ditemukan');
  }
};
