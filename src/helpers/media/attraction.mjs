import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { Attraction } from '#schemas/attraction.mjs';

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

async function _saveAttractionPhoto({ file, destinationDoc }) {
  const rootDir = process.cwd();
  const destinationSlug = destinationDoc.slug;
  const attractionSlug = destinationDoc.attraction;
  const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;

  const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}/attraction`;
  const fileSystemDir = path.join(rootDir, 'public', 'images', dynamicDir);

  await fs.mkdir(fileSystemDir, { recursive: true });
  const timestamp = Date.now();
  const photoId = nanoid(10);

  const filename = `${attractionSlug}-${photoId}-${timestamp}.webp`;
  const fileSystemPath = path.join(fileSystemDir, filename);

  await sharp(file.buffer).webp({ quality: 80 }).toFile(fileSystemPath);

  const webPath = path.join('/images', dynamicDir, filename).replace(/\\/g, '/');

  return {
    url: webPath,
    photoId,
  };
}

export const attraction = {
  checkExist: async (req, res, next) => {
    try {
    } catch (error) {}
  },

  saveAttractionPhotos: async (req, res, next) => {
    try {
    } catch (error) {}
  },

  checkOwnershipAndPhotoExist: async (req, res, next) => {
    try {
    } catch (error) {}
  },

  replaceAttractionPhoto: async (req, res, next) => {
    try {
    } catch (error) {}
  },

  cleanupFile: _deleteFile,
};
