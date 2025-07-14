import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ResponseError } from '#errors/responseError.mjs';
import { adminSchema } from '#schemas/admin.mjs';

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

const buildFilterStage = (validatedQuery) => {
  const { role } = validatedQuery;
  const filter = {};

  if (role) {
    filter.role = role;
  }

  return Object.keys(filter).length > 0 ? [{ $match: filter }] : [];
};

const buildSortStage = (validatedQuery) => {
  const { sort, sortBy } = validatedQuery;
  const sortDirection = sort === 'asc' ? 1 : -1;
  const sortStage = {};

  if (sortBy) {
    sortStage[sortBy] = sortDirection;
  } else {
    sortStage.createdAt = -1;
  }

  return { $sort: sortStage };
};

export const listAdmins = (validatedQuery) => {
  const { page, size } = validatedQuery;
  const skip = (page - 1) * size;

  const filterStage = buildFilterStage(validatedQuery);
  const sortStage = buildSortStage(validatedQuery);

  return [
    ...filterStage,
    {
      $facet: {
        metadata: [{ $count: 'totalItems' }],
        data: [
          sortStage,
          { $skip: skip },
          { $limit: size },
          {
            $project: {
              _id: 0,
              __v: 0,
              password: 0,
              createdAt: 0,
              updatedAt: 0,
              contactNumber: 0,
              email: 0,
              role: 0,
            },
          },
        ],
      },
    },
  ];
};

export const updateAdmin = async (id, validatedRequest) => {
  const originalAdmin = await Admin.findOne({ adminId: id }).select(
    '+password'
  );
  if (!originalAdmin) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Admin dengan Id ${id} tidak ditemukan`,
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
      throw new ResponseError(400, 'Password tidak tersimpan', {
        newPassword:
          'Password Baru yang anda masukkan sama dengan Password Lama.',
      });
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

  return Admin.findOneAndUpdate(
    { adminId: id },
    { $set: validatedRequest },
    { new: true }
  );
};
