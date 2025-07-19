import jwt from 'jsonwebtoken';
import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';
import { config } from '#configs/variable.mjs';

const checkDuplicates = async (validatedRequest) => {
  const check = await Admin.find({
    $or: [
      { username: validatedRequest.username },
      { email: validatedRequest.email },
      { name: validatedRequest.name },
    ],
  });

  if (check.length > 0) {
    const errors = {};
    check.forEach((admin) => {
      if (admin.username === validatedRequest.username)
        errors.username = 'Username telah terdaftar.';
      if (admin.email === validatedRequest.email)
        errors.email = 'Email telah terdaftar.';
      if (admin.name === validatedRequest.name)
        errors.name = 'Nama telah terdaftar.';
    });
    if (Object.keys(errors).length > 0) {
      throw new ResponseError(
        409,
        'Data yang diberikan sudah terdaftar.',
        errors
      );
    }
  }
};

export const createManager = async (validatedRequest) => {
  await checkDuplicates(validatedRequest);

  validatedRequest.role = 'manager';

  const newAdmin = new Admin(validatedRequest);
  return newAdmin.save();
};

export const login = async (loginRequest) => {
  const admin = await Admin.findOne({ username: loginRequest.username });
  if (!admin) {
    throw new ResponseError(401, 'Username atau password salah');
  }

  const isPasswordValid = await admin.comparePassword(loginRequest.password);
  if (!isPasswordValid) {
    throw new ResponseError(401, 'Username atau password salah.');
  }

  const payload = { id: admin.adminId, role: admin.role };
  const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });

  return { token, user: payload };
};
