import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import * as verify from '#helpers/manager.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { destinationSchema } from '#schemas/destination.mjs';

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Destination =
  mongoose.models.Destination ||
  mongoose.model('Destination', destinationSchema);

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

  /** Cek duplikasi username/email menggunakan helper */
  await verify.checkDuplicate(validatedRequest, originalAdmin);

  return Admin.findOneAndUpdate(
    { adminId: id },
    { $set: validatedRequest },
    { new: true }
  );
};

export const updateManager = async (id, adminId, validatedRequest) => {
  if (id !== adminId) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Anda tidak diizinkan mengubah data manajer lain.',
    });
  }

  if (validatedRequest.role && validatedRequest.role !== 'manager') {
    throw new ResponseError(400, 'Menolak pengubahan role.', {
      message: 'Role tidak dapat diubah.',
    });
  }

  const originalManager = await Admin.findOne({
    adminId: id,
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
      throw new ResponseError(400, 'Password tidak tersimpan', {
        newPassword:
          'Password Baru yang anda masukkan sama dengan Password Lama.',
      });
    }

    validatedRequest.password = await bcrypt.hash(
      validatedRequest.newPassword,
      10
    );
    delete validatedRequest.oldPassword;
    delete validatedRequest.newPassword;
  }

  await verify.checkDuplicate(validatedRequest, originalManager);

  const updatedManager = await Admin.findOneAndUpdate(
    { adminId: id, role: 'manager' },
    { $set: validatedRequest },
    { new: true }
  ).select('-_id -password -__v -createdAt -updatedAt');

  return updatedManager.toObject();
};

export const dropManager = async (id, adminId) => {
  if (id !== adminId) {
    throw new ResponseError(403, 'Akses ditolak.', {
      message: 'Anda tidak diizinkan menghapus akun manajer lain.',
    });
  }

  const managerToDelete = await Admin.findOne({
    adminId: id,
    role: 'manager',
  })
    .select('_id')
    .lean();

  if (!managerToDelete) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  /** Cek apakah manajer ini memiliki destinasi yang terkait */
  const destinationCount = await Destination.countDocuments({
    createdBy: managerToDelete._id,
  });

  if (destinationCount > 0) {
    throw new ResponseError(409, 'Manajer memiliki destinasi wisata.', {
      message: `Tidak dapat menghapus manajer. Hapus ${destinationCount} destinasi yang terkait terlebih dahulu.`,
    });
  }

  /** Jika tidak ada, lanjutkan proses penghapusan */
  const deletedManager = await Admin.findOneAndDelete({
    adminId: id,
    role: 'manager',
  });

  if (!deletedManager) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${id} tidak ditemukan`,
    });
  }

  return deletedManager;
};
