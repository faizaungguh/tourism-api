import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { ResponseError } from '#errors/responseError.mjs';

const ensureExists = (path) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
};

const uploadPhoto = (options) => {
  const uploader = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
      if (file.mimetype.startsWith('image/')) {
        callback(null, true);
      } else {
        callback(
          new ResponseError(415, 'File tidak diperbolehkan', {
            errors: { photo: 'Mohon maaf, hanya dokumen gambar yang diperbolehkan diunggah' },
          })
        );
      }
    },
    limits: { fileSize: 1024 * 200 },
  }).single('photo');

  const handleUpload = (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new ResponseError(413, 'Ukuran file terlalu besar', {
              errors: { photo: 'Ukuran file tidak boleh melebihi 200KB.' },
            })
          );
        }
        return next(
          new ResponseError(400, 'Gagal mengunggah file', {
            errors: { photo: err.message },
          })
        );
      } else if (err) {
        return next(err);
      }
      next();
    });
  };

  const processAndSave = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ResponseError(400, 'File tidak ditemukan', {
          errors: { photo: 'File gambar wajib diunggah.' },
        });
      }
      const { role, adminId } = req.admin;
      const timestamp = Date.now();

      const filename = `${adminId}_${timestamp}.webp`;

      const dir = path.join('public', 'images', options.subfolder, role, adminId);
      const outputPath = path.join(dir, filename);

      ensureExists(dir);

      await sharp(req.file.buffer).webp({ quality: 80 }).toFile(outputPath);

      req.file.path = outputPath;
      req.file.filename = filename;

      next();
    } catch (error) {
      next(error);
    }
  };

  return [handleUpload, processAndSave];
};

export const uploadMedia = {
  profileAdmin: uploadPhoto({ subfolder: 'profile' }),
};
