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
      console.error(`Failed to delete file at ${webPath}:`, err);
    }
  }
}

async function _saveAttractionPhoto({ file, destinationDoc, attractionDoc }) {
  const rootDir = process.cwd();
  const destinationSlug = destinationDoc.slug;
  const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
  const attractionSlug = attractionDoc.slug;

  const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}/attraction/${attractionSlug}`;
  const fileSystemDir = path.join(rootDir, 'public', 'images', dynamicDir);
  await fs.mkdir(fileSystemDir, { recursive: true });

  const timestamp = Date.now();
  const photoId = nanoid(10);

  const filename = `${attractionSlug}-${photoId}-${timestamp}.webp`;
  const fileSystemPath = path.join(fileSystemDir, filename);

  await sharp(file.buffer).webp({ quality: 80 }).toFile(fileSystemPath);
  const webPath = path.join('/images', dynamicDir, filename).replace(/\\/g, '/');

  return { url: webPath, photoId };
}

export const attraction = {
  photo: {
    save: async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          throw new ResponseError(422, 'Proses dihentikan', {
            message: 'Anda harus menyertakan setidaknya satu file gambar.',
          });
        }

        const { foundDestination, foundAttraction } = req;

        const currentPhotoCount = foundAttraction.photos ? foundAttraction.photos.length : 0;
        const newPhotoCount = req.files.length;
        const MAX_PHOTOS = 10;

        if (currentPhotoCount + newPhotoCount > MAX_PHOTOS) {
          throw new ResponseError(413, 'Data tidak diproses', {
            photo: `Kapasitas galeri wahana melebihi batas ${MAX_PHOTOS} foto.`,
          });
        }

        const processedPhotos = [];
        for (const file of req.files) {
          const photoData = await _saveAttractionPhoto({
            file,
            destinationDoc: foundDestination,
            attractionDoc: foundAttraction,
          });
          processedPhotos.push(photoData);
        }

        req.processedPhotos = processedPhotos;
        next();
      } catch (error) {
        next(error);
      }
    },

    replace: async (req, res, next) => {
      try {
        if (!req.file) {
          throw new ResponseError(422, 'Proses dihentikan', {
            message: 'Anda harus menyertakan satu file gambar pengganti.',
          });
        }

        const { foundDestination, foundAttraction, photoToUpdate } = req;

        const newPhotoData = await _saveAttractionPhoto({
          file: req.file,
          destinationDoc: foundDestination,
          attractionDoc: foundAttraction,
        });

        await _deleteFile(photoToUpdate.url);

        req.newPhotoData = newPhotoData;
        next();
      } catch (error) {
        if (req.newPhotoData) {
          await _deleteFile(req.newPhotoData.url);
        }
        next(error);
      }
    },
  },

  cleanupFile: _deleteFile,
};
