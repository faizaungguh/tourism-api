import jwt from 'jsonwebtoken';
import { config } from '#configs/variable.mjs';
import { adminSchema } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const Admin = mongoose.model('Admin', adminSchema);

export const authMiddleware = {
  getToken: async (req, res, next) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      try {
        token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, config.JWT_SECRET);

        req.admin = await Admin.findById(decoded.id).selec('-password');

        if (!req.admin) {
          return next(
            new ResponseError(403, 'Tidak dapat mengidentifikasi admin', {
              error: 'Mohon maaf permintaan untuk login ditolak',
            })
          );
        }

        next();
      } catch (error) {
        return next(new ResponseError(403));
      }
    }
  },

  deleteToken: async (req, res, next) => {},
};
