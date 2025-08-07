import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
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

async function _saveGalleryPhoto({ file, destinationDoc }) {
  const rootDir = process.cwd();
  const destinationSlug = destinationDoc.slug;
  const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;

  const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}/gallery`;
  const fileSystemDir = path.join(rootDir, 'public', 'images', dynamicDir);

  await fs.mkdir(fileSystemDir, { recursive: true });

  const timestamp = Date.now();
  const photoId = nanoid(10);

  const filename = `${destinationSlug}-${photoId}-${timestamp}.webp`;
  const fileSystemPath = path.join(fileSystemDir, filename);

  await sharp(file.buffer).webp({ quality: 80 }).toFile(fileSystemPath);

  const webPath = path.join('/images', dynamicDir, filename).replace(/\\/g, '/');

  return {
    url: webPath,
    photoId,
    caption: '',
  };
}

export const destination = {
  checkExist: async (req, res, next) => {
    try {
      const { slug } = req.params;

      const destinationDoc = await Destination.findOne({ slug })
        .select('slug galleryPhoto locations')
        .populate({
          path: 'locations.subdistrict',
          select: 'abbrevation',
        });

      if (!destinationDoc) {
        throw new ResponseError(404, 'Destinasi tidak ditemukan', {
          message: `Middleware tidak berhasil menemukan destinasi sebelum mencapai controller.`,
        });
      }

      req.foundDestination = destinationDoc;
      next();
    } catch (error) {
      next(error);
    }
  },

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
        throw new ResponseError(404, 'Destinasi tidak ditemukan', {
          message: `Destinasi dengan slug "${slug}" tidak ditemukan.`,
        });
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

  saveGalleryPhotos: async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        throw new ResponseError(400, 'Tidak ada file', {
          photo: 'Anda harus menyertakan setidaknya satu file gambar untuk galeri.',
        });
      }

      const destinationDoc = req.foundDestination;
      const currentPhotoCount = destinationDoc.galleryPhoto.length;
      const newPhotoCount = req.files.length;

      if (currentPhotoCount + newPhotoCount > 8) {
        const remainingSlots = 8 - currentPhotoCount;
        throw new ResponseError(413, 'Kapasitas galeri tidak mencukupi', {
          message: `Galeri sudah berisi ${currentPhotoCount} foto. Anda hanya dapat mengunggah ${
            remainingSlots > 0 ? remainingSlots : 0
          } foto lagi.`,
        });
      }

      const processedGallery = [];
      for (const file of req.files) {
        const photoData = await _saveGalleryPhoto({
          file,
          destinationDoc,
        });
        processedGallery.push(photoData);
      }

      req.processedGallery = processedGallery;
      next();
    } catch (error) {
      next(error);
    }
  },
};
