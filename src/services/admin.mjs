import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import * as checker from '#validations/admin.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/adminPipeline.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const create = async (request) => {
  validate.isNotEmpty(request);
  /** Validasi input request. */
  const validatedRequest = validate.requestCheck(
    checker.adminValidation,
    request
  );

  /** Cek duplikasi username dan email. */
  const checkDuplicate = await Admin.find({
    $or: [
      { username: validatedRequest.username },
      { email: validatedRequest.email },
    ],
  }).select('username email');

  /** Lempar error jika ditemukan duplikasi. */
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

  /** Hash password sebelum disimpan. */
  validatedRequest.password = await bcrypt.hash(validatedRequest.password, 10);

  /** Atur role secara otomatis menjadi 'admin'. */
  validatedRequest.role = 'admin';

  /** Simpan data admin baru ke database. */
  const newAdmin = new Admin(validatedRequest);
  const savedAdmin = await newAdmin.save();

  /** Kembalikan data admin yang sudah disimpan. */
  return savedAdmin;
};

export const getAll = async (query) => {
  /** validasi dan ambil nilai default dari query */
  const validatedQuery = validate.requestCheck(
    checker.listAdminValidation,
    query
  );

  /** Dapatkan aggregation pipeline dari helper */
  const pipeline = helper.listAdmins(validatedQuery);

  const result = await Admin.aggregate(pipeline);

  const data = result[0].data;
  const totalItems = result[0].metadata[0]
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
  /** cari admin berdasarkan adminId */
  const admin = await Admin.findOne({ adminId: id }).select('-password -__v');

  /** jika admin tidak ditemukan, tampilkan pesan error */
  if (!admin) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Admin dengan Id ${id} tidak ditemukan`,
    });
  }

  /** kembalikan data admin */
  return admin;
};

export const update = async (id, request) => {
  /** cek apakah ada data yang dikirim */
  validate.isNotEmpty(request);

  const validatedRequest = validate.requestCheck(
    checker.patchAdminValidation,
    request
  );

  const updatedAdmin = await helper.updateAdmin(id, validatedRequest);

  return updatedAdmin;
};

export const drop = async (id) => {
  /** cari adminId dan hapus, lalu kembalikan dokumen yang dihapus */
  const deletedAdmin = await Admin.findOneAndDelete({ adminId: id });

  if (!deletedAdmin) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Admin dengan Id ${id} tidak ditemukan`,
    });
  }

  return deletedAdmin;
};
