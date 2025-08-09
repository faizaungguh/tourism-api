import jwt from 'jsonwebtoken';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';
import { config } from '#configs/variable.mjs';

export const authHelper = {
  create: async (validatedRequest) => {
    validatedRequest.role = 'manager';

    const newAdmin = new Admin(validatedRequest);

    return newAdmin.save();
  },

  login: async (loginRequest) => {
    const admin = await Admin.findOne({ username: loginRequest.username });

    if (!admin || !(await admin.comparePassword(loginRequest.password))) {
      throw new ResponseError(401, 'Pencocokan data gagal.', {
        message: 'Username atau password yang Anda masukkan salah.',
      });
    }

    const payload = { id: admin.adminId, role: admin.role };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });

    return { token, user: payload };
  },
};
