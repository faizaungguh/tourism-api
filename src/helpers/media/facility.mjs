import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';

async function _deleteFile(webPath) {
  if (!webPath) return;
  try {
    const rootDir = process.cwd();
    const correctedPath = webPath.startsWith('/') ? webPath.substring(1) : webPath;
    const absolutePath = path.join(rootDir, 'public', correctedPath);
    await fs.unlink(absolutePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Gagal menghapus file di ${webPath}:`, err);
    }
  }
}

async function _saveFacilityPhoto({ file, destinationDoc, facilityDoc }) {
  const rootDir = process.cwd();
  const destinationSlug = destinationDoc.slug;
  const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
  const facilitySlug = facilityDoc.slug;

  const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}/facility/${facilitySlug}`;
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
  };
}

export const facility = {
  checkOwnership: async (req, res, next) => {
    try {
      const { destinations: destinationSlug } = req.params;
      const { adminId } = req.admin;

      const destinationDoc = await Destination.findOne({ slug: destinationSlug })
        .populate({
          path: 'createdBy',
          select: 'adminId',
        })
        .populate({
          path: 'locations.subdistrict',
          select: 'abbrevation',
        });

      if (!destinationDoc) {
        throw new ResponseError(404, 'Destinasi tidak ditemukan');
      }

      if (!destinationDoc.createdBy) {
        throw new ResponseError(
          500,
          `Data admin untuk destinasi '${destinationSlug}' tidak valid atau tidak ditemukan.`
        );
      }

      if (destinationDoc.createdBy.adminId !== adminId) {
        throw new ResponseError(403, 'Anda tidak memiliki akses ke sumber daya ini');
      }

      req.destinationDoc = destinationDoc;
      next();
    } catch (error) {
      next(error);
    }
  },

  isExist: async (req, res, next) => {
    try {
      const { facility: facilitySlug } = req.params;
      const { destinationDoc } = req;

      const facility = destinationDoc.facility.find((f) => f.slug === facilitySlug);
      if (!facility) {
        throw new ResponseError(404, 'Fasilitas tidak ditemukan pada destinasi ini');
      }

      req.facilityDoc = facility;
      next();
    } catch (error) {
      next(error);
    }
  },

  saveFacilityPhotos: async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        throw new ResponseError(400, 'Tidak ada file', {
          photo: 'Anda harus menyertakan setidaknya satu file gambar untuk galeri.',
        });
      }

      const { destinationDoc, facilityDoc } = req;
      const currentPhotoCount = facilityDoc.photo.length;
      const newPhotoCount = req.files.length;
      const MAX_PHOTOS = 6;

      if (currentPhotoCount + newPhotoCount > MAX_PHOTOS) {
        const remainingSlots = MAX_PHOTOS - currentPhotoCount;
        throw new ResponseError(413, 'Kapasitas galeri fasilitas tidak mencukupi', {
          message: `Galeri sudah berisi ${currentPhotoCount} foto. Anda hanya dapat mengunggah ${
            remainingSlots > 0 ? remainingSlots : 0
          } foto lagi.`,
        });
      }

      const processedPhotos = [];

      for (const file of req.files) {
        const photoData = await _saveFacilityPhoto({
          file,
          destinationDoc,
          facilityDoc,
        });
        processedPhotos.push(photoData);
      }

      req.processedFacilityPhotos = processedPhotos;
      next();
    } catch (error) {
      next(error);
    }
  },

  checkOwnershipAndPhotoExist: async (req, res, next) => {
    try {
    } catch (error) {}
  },

  replaceFacilityPhoto: async (req, res, next) => {
    try {
    } catch (error) {}
  },

  cleanupFile: _deleteFile,
};
