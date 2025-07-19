import bcrypt from 'bcrypt';
import * as verify from '#helpers/duplication.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';
import { Destination } from '#schemas/destination.mjs';

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
  return {
    $sort: { [sortBy]: sort === 'asc' ? 1 : -1 },
  };
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
              email: 0,
              contactNumber: 0,
              role: 0,
              password: 0,
              __v: 0,
            },
          },
        ],
      },
    },
  ];
};

export const createAdmin = async (validatedRequest) => {
  /** Cek duplikasi username, email, dan name. */
  const checkDuplicate = await Admin.find({
    $or: [
      { username: validatedRequest.username },
      { email: validatedRequest.email },
      { name: validatedRequest.name },
    ],
  }).select('username name email');

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
      if (admin.name === validatedRequest.name) {
        duplicateErrors.name = 'Name telah terdaftar.';
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

  return Admin.create(validatedRequest);
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
  ).select('-_id -password -__v');

  return updatedManager.toObject();
};

export const dropManager = async (managerId, role) => {
  const managerToDelete = await Admin.findOne({
    adminId: managerId,
  })
    .select('_id')
    .lean();

  if (!managerToDelete) {
    throw new ResponseError(404, 'Id tidak ditemukan', {
      message: `Manajer dengan Id ${managerId} tidak ditemukan`,
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
    adminId: managerId,
    role: 'manager',
  });

  return deletedManager;
};
