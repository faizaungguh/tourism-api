import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { Admin } from '#schemas/admin.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const baseMulter = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(
        new ResponseError(415, 'Ekstensi tidak didukung', {
          photo:
            'Dokumen yang didukung adalah berupa gambar dengan ekstensi seperti .jpg, .png, dan sebagainya.',
        })
      );
    }
  },
};

const createMedia = (uploader, limits) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return next(
            new ResponseError(413, 'Dokumen terlalu besar', {
              photo: `Ukuran dokumen yang Anda kirim terlalu besar, ukuran maksimal ${
                limits.fileSize / 1024
              }KB.`,
            })
          );
        case 'LIMIT_UNEXPECTED_FILE':
          return next(
            new ResponseError(422, 'Dokumen tidak diterima', {
              photo: `Hanya satu file dengan nama field 'photo' yang diizinkan.`,
            })
          );
        default:
          return next(new ResponseError(422, `Gagal mengunggah file: ${err.code}`, err.message));
      }
    } else if (err) {
      return next(err);
    }
    next();
  });
};

const saveAdminPhoto = (options) => async (req, res, next) => {
  try {
    if (!req.file) return next();

    const dynamicPath = options.getDynamicPath(req);
    if (!dynamicPath) {
      throw new ResponseError(404, 'ID untuk path file tidak ditemukan di URL.');
    }

    const dir = path.join('public', 'images', options.subfolder, dynamicPath);
    await fs.mkdir(dir, { recursive: true });

    const timestamp = Date.now();
    const filename = `${req.admin.adminId}-profile-${timestamp}.webp`;
    const outputPath = path.join(dir, filename);

    await sharp(req.file.buffer).webp({ quality: 80 }).toFile(outputPath);

    req.processedFiles = {
      photo: outputPath.replace('public', ''),
    };

    next();
  } catch (error) {
    next(error);
  }
};

const checkExisted = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findOne({ adminId: id });
    if (!admin) {
      throw new ResponseError(404, `Admin dengan ID ${id} tidak ditemukan.`);
    }
    req.foundAdmin = admin;
    next();
  } catch (error) {
    next(error);
  }
};

const adminMedia = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).single('photo');
  },
};

export const uploadMedia = {
  profileAdmin: [
    checkExisted,
    createMedia(adminMedia.uploader, adminMedia.limits),
    saveAdminPhoto({
      subfolder: 'profile',
      getDynamicPath: (req) => req.params.id,
    }),
  ],
};
