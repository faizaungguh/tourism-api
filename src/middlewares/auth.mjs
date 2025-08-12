import jwt from 'jsonwebtoken';
import { config } from '#configs/variable.mjs';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

export const authMiddleware = {
  protect: async (req, res, next) => {
    let token;

    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new ResponseError(401, 'Akses ditolak', {
          message: 'Anda tidak memiliki akses ke fitur ini, silakan signin terlebih dahulu',
        })
      );
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);

      req.admin = await Admin.findOne({ adminId: decoded.id }).select('adminId role -_id');

      if (!req.admin) {
        return next(
          new ResponseError(401, 'Akses ditolak', {
            message:
              'Data Admin yang anda masukkan salah, dan sekarang anda tidak memiliki akses ke akun anda',
          })
        );
      }

      next();
    } catch (error) {
      return next(
        new ResponseError(401, 'Akses ditolak', {
          message:
            'Anda tidak memiliki akses untuk masuk ke dalam akun anda, karena token akses anda tidak valid atau sudah kedaluarsa',
        })
      );
    }
  },

  authorize: (...roles) => {
    return async (req, res, next) => {
      if (roles.length > 0 && !roles.includes(req.admin.role)) {
        const allowedRoles = roles.join(' atau ');
        return next(
          new ResponseError(403, 'Akses ditolak', {
            error: `Anda tidak memiliki izin. Role yang diizinkan: ${allowedRoles}.`,
          })
        );
      }

      next();
    };
  },
};
