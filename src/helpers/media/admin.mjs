import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

async function _savePhoto({ file, adminId, dynamicPath, subfolder }) {
  const rootDir = process.cwd();
  const fileSystemDir = path.join(rootDir, 'public', 'images', subfolder, dynamicPath);
  await fs.mkdir(fileSystemDir, { recursive: true });

  const timestamp = Date.now();
  const filename = `${adminId}-profile-${timestamp}.webp`;
  const fileSystemPath = path.join(fileSystemDir, filename);

  await sharp(file.buffer).webp({ quality: 80 }).toFile(fileSystemPath);
  const webPath = path.join('/images', subfolder, dynamicPath, filename).replace(/\\/g, '/');

  return webPath;
}

async function _checkExist(adminId) {
  const admin = await Admin.findOne({ adminId });

  if (!admin) {
    throw new ResponseError(404, `Admin dengan ID ${adminId} tidak ditemukan.`);
  }

  return admin;
}

export const admin = {
  async checkExist(req, res, next) {
    try {
      const { id } = req.params;
      const admin = await _checkExist(id);
      req.foundAdmin = admin;
      next();
    } catch (error) {
      next(error);
    }
  },

  savePhoto: (options) => async (req, res, next) => {
    try {
      if (!req.file) return next();

      const dynamicPath = options.getDynamicPath(req);
      if (!dynamicPath) {
        throw new ResponseError(404, 'Path tidak ditemukan', {
          message: 'ID untuk path file tidak ditemukan di URL.',
        });
      }

      const photoPath = await _savePhoto({
        file: req.file,
        adminId: req.params.id,
        dynamicPath,
        subfolder: options.subfolder,
      });

      req.processedFiles = {
        photo: photoPath,
      };

      next();
    } catch (error) {
      next(error);
    }
  },
};
