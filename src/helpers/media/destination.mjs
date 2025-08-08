import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';
import { mediaService } from '#services/media.mjs';

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
  };
}

export const destination = {
  check: {
    isExist: async (req, res, next) => {
      try {
        const { destinations } = req.params;
        const destinationDoc = await Destination.findOne({ slug: destinations }).populate(
          'attractions'
        );

        if (!destinationDoc) {
          throw new ResponseError(404, 'Destinasi tidak ditemukan');
        }

        req.foundDestination = destinationDoc;
        next();
      } catch (error) {
        next(error);
      }
    },

    isAdminOwned: async (req, res, next) => {
      try {
        const { destinations } = req.params;
        const { adminId } = req.admin;

        const destinationDoc = await Destination.findOne({ slug: destinations })
          .populate('attractions')
          .populate({ path: 'createdBy', select: 'adminId' })
          .populate({ path: 'locations.subdistrict', select: 'abbrevation' });

        if (!destinationDoc) {
          throw new ResponseError(404, 'Destinasi tidak ditemukan');
        }

        if (!destinationDoc.createdBy) {
          throw new ResponseError(
            500,
            `Data admin untuk destinasi '${destinations}' rusak atau tidak ditemukan.`
          );
        }
        if (destinationDoc.createdBy.adminId !== adminId) {
          throw new ResponseError(403, 'Akses ditolak. Anda bukan pemilik destinasi ini.');
        }

        req.foundDestination = destinationDoc;
        next();
      } catch (error) {
        next(error);
      }
    },

    isGalleryExist: async (req, res, next) => {
      try {
        const { id: photoId } = req.params;
        const { foundDestination } = req;

        const photoToUpdate = foundDestination.galleryPhoto.find((p) => p.photoId === photoId);
        if (!photoToUpdate) {
          throw new ResponseError(
            404,
            `Foto dengan ID "${photoId}" tidak ditemukan di galeri ini.`
          );
        }

        req.photoToUpdate = photoToUpdate;
        next();
      } catch (error) {
        next(error);
      }
    },

    isFacilityExist: async (req, res, next) => {
      try {
        const { facility: facilitySlug } = req.params;
        const { foundDestination } = req;

        if (!foundDestination) {
          throw new ResponseError(
            500,
            'Middleware check.isExist untuk destinasi harus dijalankan terlebih dahulu.'
          );
        }

        const facilityDoc = foundDestination.facility.find((f) => f.slug === facilitySlug);

        if (!facilityDoc) {
          throw new ResponseError(
            404,
            `Fasilitas dengan slug "${facilitySlug}" tidak ditemukan pada destinasi ini.`
          );
        }

        req.foundFacility = facilityDoc;
        next();
      } catch (error) {
        next(error);
      }
    },

    isFacilityPhotoExist: async (req, res, next) => {
      try {
        const { id: photoId } = req.params;
        const { foundFacility } = req;

        const photo = foundFacility.photo.find((p) => p.photoId === photoId);
        if (!photo) {
          throw new ResponseError(404, `Foto dengan ID "${photoId}" tidak ditemukan.`);
        }

        req.photoToDelete = photo;
        next();
      } catch (error) {
        next(error);
      }
    },

    isAttractionExist: async (req, res, next) => {
      try {
        const { attractions: attractionSlug } = req.params;
        const { foundDestination } = req;

        const attractionDoc = foundDestination.attractions.find((a) => a.slug === attractionSlug);
        if (!attractionDoc) {
          throw new ResponseError(
            404,
            `Wahana dengan slug "${attractionSlug}" tidak ditemukan pada destinasi ini.`
          );
        }

        req.foundAttraction = attractionDoc;
        next();
      } catch (error) {
        next(error);
      }
    },
  },

  photos: {
    save: async (req, res, next) => {
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
  },

  gallery: {
    save: async (req, res, next) => {
      try {
        if (!req.files || req.files.length === 0) {
          throw new ResponseError(400, 'Anda harus menyertakan setidaknya satu file gambar.');
        }

        const { foundDestination } = req;

        const currentPhotoCount = foundDestination.galleryPhoto.length;
        const newPhotoCount = req.files.length;
        const MAX_PHOTOS = 8;

        if (currentPhotoCount + newPhotoCount > MAX_PHOTOS) {
          const remainingSlots = MAX_PHOTOS - currentPhotoCount;
          throw new ResponseError(
            413,
            `Kapasitas galeri tidak mencukupi. Anda hanya dapat mengunggah ${
              remainingSlots > 0 ? remainingSlots : 0
            } foto lagi.`
          );
        }

        const processedPhotos = [];
        for (const file of req.files) {
          const photoData = await _saveGalleryPhoto({
            file,
            destinationDoc: foundDestination,
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
          throw new ResponseError(422, 'File tidak ada', {
            photo: 'Anda harus menyertakan satu file gambar untuk pembaruan.',
          });
        }

        const { foundDestination, photoToUpdate, file } = req;

        await _deleteFile(photoToUpdate.url);

        const newPhotoData = await _saveGalleryPhoto({
          file,
          destinationDoc: foundDestination,
        });

        newPhotoData.caption = req.body.caption || photoToUpdate.caption;

        req.processedPhotoUpdate = {
          oldPhotoId: photoToUpdate.photoId,
          newPhotoData: newPhotoData,
        };

        next();
      } catch (error) {
        next(error);
      }
    },

    deleteAll: async (req, res, next) => {
      try {
        await mediaService.destination.gallery.deleteAll(req.foundDestination);
        next();
      } catch (error) {
        next(error);
      }
    },

    deleteOne: async (req, res, next) => {
      try {
        const { id: photoId } = req.params;
        await mediaService.destination.gallery.delete(req.foundDestination, photoId);
        next();
      } catch (error) {
        next(error);
      }
    },
  },

  cleanupFile: _deleteFile,
};
