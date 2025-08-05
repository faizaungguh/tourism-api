import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';

async function _saveDestinationPhoto({ file, destinationDoc, fieldName }) {
  const rootDir = process.cwd();

  const destinationSlug = destinationDoc.slug;
  const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
  const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}`;
  const fileSystemDir = path.join(rootDir, 'public', 'images', dynamicDir);

  await fs.mkdir(fileSystemDir, { recursive: true });

  const timestamp = Date.now();
  const filename = `${fieldName}-${destinationSlug}-${timestamp}.webp`;
  const fileSystemPath = path.join(fileSystemDir, filename);

  await sharp(file.buffer).webp({ quality: 80 }).toFile(fileSystemPath);

  const webPath = path.join('/images', dynamicDir, filename).replace(/\\/g, '/');

  return webPath;
}

export const destination = {
  checkOwnership: async (req, res, next) => {
    try {
      const { slug } = req.params;
      const { adminId } = req.admin;

      const destinationDoc = await Destination.findOne({ slug })
        .populate({
          path: 'createdBy',
          select: 'adminId',
        })
        .populate({
          path: 'locations.subdistrict',
          select: 'abbrevation',
        });

      if (!destinationDoc) {
        throw new ResponseError(404, `Destinasi dengan slug "${slug}" tidak ditemukan.`);
      }

      if (destinationDoc.createdBy.adminId !== adminId) {
        throw new ResponseError(403, 'Akses ditolak', {
          message: 'Anda bukan pemilik atau pengelola destinasi ini.',
        });
      }

      req.foundDestination = destinationDoc;
      next();
    } catch (error) {
      next(error);
    }
  },

  savePhotos: async (req, res, next) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return next();
      }

      const processedPhotos = {};
      const destinationDoc = req.foundDestination;

      if (req.files.profilePhoto) {
        const file = req.files.profilePhoto[0];
        processedPhotos.profilePhoto = await _saveDestinationPhoto({
          file,
          destinationDoc,
          fieldName: 'profilePhoto',
        });
      }

      if (req.files.headlinePhoto) {
        const file = req.files.headlinePhoto[0];
        processedPhotos.headlinePhoto = await _saveDestinationPhoto({
          file,
          destinationDoc,
          fieldName: 'headlinePhoto',
        });
      }

      req.processedPhotos = processedPhotos;
      next();
    } catch (error) {
      next(error);
    }
  },
};
