import bcrypt from 'bcrypt';
import * as verify from '#helpers/data/duplication.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';

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

const _handlePasswordUpdate = async (validatedRequest, originalPasswordHash) => {
  if (!validatedRequest.oldPassword || !validatedRequest.newPassword) {
    throw new ResponseError(422, 'Proses dihentikan', {
      message: 'Anda harus memasukkan password lama dan password baru anda',
    });
  }

  const isPasswordMatch = await bcrypt.compare(validatedRequest.oldPassword, originalPasswordHash);

  if (!isPasswordMatch) {
    throw new ResponseError(401, 'Data ubahan ditolak.', {
      oldPassword: 'Password lama yang Anda masukkan salah.',
    });
  }

  if (validatedRequest.newPassword === validatedRequest.oldPassword) {
    throw new ResponseError(401, 'Data ubahan ditolak', {
      newPassword: 'Password Baru yang anda masukkan sama dengan Password Lama.',
    });
  }

  /** Jika cocok, hash password baru */
  validatedRequest.password = await bcrypt.hash(validatedRequest.newPassword, 10);

  /** Hapus field sementara agar tidak tersimpan di database */
  delete validatedRequest.oldPassword;
  delete validatedRequest.newPassword;
};

export const adminHelper = {
  listAdmins: (validatedQuery) => {
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
                email: 0,
                contactNumber: 0,
                role: 0,
                password: 0,
                photo: 0,
              },
            },
          ],
        },
      },
    ];
  },

  updateAdmin: async (id, validatedRequest) => {
    const originalAdmin = await Admin.findOne({ adminId: id }).select('+password');

    if (!originalAdmin) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Admin dengan Id ${id} tidak ditemukan`,
      });
    }

    if (validatedRequest.oldPassword || validatedRequest.newPassword) {
      await _handlePasswordUpdate(validatedRequest, originalAdmin.password);
    }

    /** Cek duplikasi username/email menggunakan helper */
    await verify.checkDuplicate(validatedRequest, originalAdmin);

    return Admin.findOneAndUpdate({ adminId: id }, { $set: validatedRequest }, { new: true });
  },

  updateManager: async (id, adminId, validatedRequest) => {
    if (id !== adminId) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Anda tidak diizinkan mengubah data manajer lain.',
      });
    }

    if (validatedRequest.role && validatedRequest.role !== 'manager') {
      throw new ResponseError(403, 'Data ubahan ditolak.', {
        message: 'Role yang anda miliki tidak dapat diubah.',
      });
    }

    const originalManager = await Admin.findOne({
      adminId: id,
      role: 'manager',
    }).select('+password, -__v');

    if (!originalManager) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Manajer dengan Id ${id} tidak ditemukan`,
      });
    }

    if (validatedRequest.oldPassword || validatedRequest.newPassword) {
      await _handlePasswordUpdate(validatedRequest, originalManager.password);
    }

    await verify.checkDuplicate(validatedRequest, originalManager);

    const updatedManager = await Admin.findOneAndUpdate(
      { adminId: id, role: 'manager' },
      { $set: validatedRequest },
      { new: true }
    );

    return updatedManager.toObject();
  },
};
