import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { ResponseError } from '#errors/responseError.mjs';

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
  photo: {
    save: async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          throw new ResponseError(400, 'Anda harus menyertakan setidaknya satu file gambar.');
        }

        const { foundDestination, foundFacility } = req;
        const currentPhotoCount = foundFacility.photo.length;
        const newPhotoCount = req.files.length;
        const MAX_PHOTOS = 6;

        if (currentPhotoCount + newPhotoCount > MAX_PHOTOS) {
          const remainingSlots = MAX_PHOTOS - currentPhotoCount;
          throw new ResponseError(
            413,
            `Kapasitas galeri fasilitas tidak mencukupi. Anda hanya dapat mengunggah ${
              remainingSlots > 0 ? remainingSlots : 0
            } foto lagi.`
          );
        }

        const processedPhotos = [];
        for (const file of req.files) {
          const photoData = await _saveFacilityPhoto({
            file,
            destinationDoc: foundDestination,
            facilityDoc: foundFacility,
          });
          processedPhotos.push(photoData);
        }

        req.processedFacilityPhotos = processedPhotos;
        next();
      } catch (error) {
        next(error);
      }
    },

    replace: async (req, res, next) => {
      try {
      } catch (error) {}
    },
  },

  cleanupFile: _deleteFile,
};
