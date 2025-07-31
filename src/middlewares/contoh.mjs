import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { ResponseError } from '#errors/responseError.mjs';

const baseMulterOptions = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(new ResponseError(415, 'Hanya file gambar yang diperbolehkan.'));
    }
  },
};

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const num = bytes / k ** i;
  const finalDecimals = num % 1 === 0 ? 0 : dm;
  return `${parseFloat(num.toFixed(finalDecimals))} ${sizes[i]}`;
};

const createUploaderMiddleware = (uploader, limits) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        const friendlySize = formatBytes(limits.fileSize);
        return next(new ResponseError(413, `Ukuran file terlalu besar. Maksimal ${friendlySize}.`));
      }
      return next(new ResponseError(400, 'Gagal mengunggah file.', err.message));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

const createProcessAndSaveMiddleware = (options) => async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const dynamicPath = options.getDynamicPath(req);
    if (!dynamicPath) throw new ResponseError(400, 'ID untuk path file tidak ditemukan.');

    const dir = path.join('public', 'images', options.subfolder, dynamicPath);
    await fs.mkdir(dir, { recursive: true });

    const filesToProcess = req.file ? { [req.file.fieldname]: [req.file] } : req.files;
    req.processedFiles = {};

    for (const field in filesToProcess) {
      req.processedFiles[field] = [];
      for (const file of filesToProcess[field]) {
        const timestamp = Date.now();
        const filename = `${field}-${timestamp}.webp`;
        const outputPath = path.join(dir, filename);

        await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);
        req.processedFiles[field].push(outputPath.replace('public', ''));
      }
      if (
        req.file ||
        (req.files[field] && req.files[field].length === 1 && multer({}).single(field))
      ) {
        req.processedFiles[field] = req.processedFiles[field][0];
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

const adminProfileLimits = { fileSize: 1024 * 200 };
const adminProfileUploader = multer({
  ...baseMulterOptions,
  limits: adminProfileLimits,
}).single('photo');

const destinationPhotosLimits = { fileSize: 1024 * 1024 * 2 };
const destinationPhotosUploader = multer({
  ...baseMulterOptions,
  limits: destinationPhotosLimits,
}).fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'headlinePhoto', maxCount: 1 },
  { name: 'galleryPhoto', maxCount: 10 },
]);

const facilityPhotosLimits = { fileSize: 1024 * 1024 * 2 };
const facilityPhotosUploader = multer({
  ...baseMulterOptions,
  limits: facilityPhotosLimits,
}).array('photos', 5);

export const uploadMedia = {
  profileAdmin: [
    createUploaderMiddleware(adminProfileUploader, adminProfileLimits),
    createProcessAndSaveMiddleware({
      subfolder: 'profiles',
      getDynamicPath: (req) => req.admin.adminId,
    }),
  ],
  destination: [
    createUploaderMiddleware(destinationPhotosUploader, destinationPhotosLimits),
    createProcessAndSaveMiddleware({
      subfolder: 'destinations',
      getDynamicPath: (req) => req.params.destinationId,
    }),
  ],
  facility: [
    createUploaderMiddleware(facilityPhotosUploader, facilityPhotosLimits),
    createProcessAndSaveMiddleware({
      subfolder: 'facilities',
      getDynamicPath: (req) => `${req.params.destinationId}/${req.params.facilityId}`,
    }),
  ],
};
