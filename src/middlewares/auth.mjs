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
        new ResponseError(401, 'Tidak terautentikasi, silakan login')
      );
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);

      req.admin = await Admin.findOne({ adminId: decoded.id }).select(
        'adminId role -_id'
      );

      if (!req.admin) {
        return next(new ResponseError(401, 'Admin tidak ditemukan'));
      }

      next();
    } catch (error) {
      return next(new ResponseError(401, 'Token tidak valid atau kedaluwarsa'));
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
