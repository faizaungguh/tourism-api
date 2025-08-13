import multer from 'multer';
import { ResponseError } from '#errors/responseError.mjs';
import { helper } from '#helpers/index.mjs';

const baseMulterConfig = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(
        new ResponseError(415, 'Tipe file tidak didukung', {
          photo: 'Hanya file gambar (seperti .jpg, .png) yang diizinkan.',
        }),
      );
    }
  },
};

const createMedia = (config) => {
  const uploader = multer({
    ...baseMulterConfig,
    limits: config.limits,
  })[config.uploadType](config.fieldSettings, config.maxCount);

  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        let message = 'Terjadi kesalahan saat mengupload file.';
        switch (err.code) {
          case 'LIMIT_FILE_SIZE':
            message = `Ukuran file terlalu besar. Maksimal ${config.limits.fileSize / 1024}KB.`;
            return next(new ResponseError(413, 'Data tidak diproses', { photo: message }));
          case 'LIMIT_UNEXPECTED_FILE':
            message = `Field file tidak sesuai. Pastikan nama field benar.`;
            return next(new ResponseError(422, 'Data tidak diproses', { photo: message }));
          case 'LIMIT_FILE_COUNT':
            message = `Jumlah file yang diupload melebihi batas yang diizinkan.`;
            return next(new ResponseError(413, 'Data tidak diproses', { photo: message }));
          default:
            return next(new ResponseError(422, 'Data tidak diproses', { photo: err.message }));
        }
      } else if (err) {
        return next(err);
      }
      next();
    });
  };
};

const mediaConfig = {
  admin: {
    profile: {
      limits: { fileSize: 1024 * 100 },
      uploadType: 'single',
      fieldSettings: 'photo',
    },
  },

  destination: {
    mainPhotos: {
      limits: { fileSize: 1024 * 200 },
      uploadType: 'fields',
      fieldSettings: [
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'headlinePhoto', maxCount: 1 },
      ],
    },

    gallery: {
      Add: {
        limits: { fileSize: 1024 * 350 },
        uploadType: 'array',
        fieldSettings: 'galleryPhoto',
        maxCount: 8,
      },
      Replace: {
        limits: { fileSize: 1024 * 350 },
        uploadType: 'single',
        fieldSettings: 'galleryPhoto',
      },
    },

    facility: {
      Add: {
        limits: { fileSize: 1024 * 350 },
        uploadType: 'array',
        fieldSettings: 'photo',
        maxCount: 6,
      },
      Replace: {
        limits: { fileSize: 1024 * 350 },
        uploadType: 'single',
        fieldSettings: 'photo',
      },
    },

    attraction: {
      Add: {
        limits: { fileSize: 1024 * 350 },
        uploadType: 'array',
        fieldSettings: 'photo',
        maxCount: 6,
      },
      Replace: {
        limits: { fileSize: 1024 * 350 },
        uploadType: 'single',
        fieldSettings: 'photo',
      },
    },
  },
};

export const handleMedia = {
  admin: {
    updateMedia: [
      helper.Media.admin.checkIsExist,
      createMedia(mediaConfig.admin.profile),
      helper.Media.admin.photo.save({
        subfolder: 'profile',
        getDynamicPath: (req) => req.params.id,
      }),
    ],
    get: [helper.Media.admin.checkIsExist],
  },

  destination: {
    updateMedia: [
      helper.Media.destination.check.isAdminOwned,
      createMedia(mediaConfig.destination.mainPhotos),
      helper.Media.destination.photos.save,
    ],

    gallery: {
      add: [
        helper.Media.destination.check.isAdminOwned,
        createMedia(mediaConfig.destination.gallery.Add),
        helper.Media.destination.gallery.save,
      ],
      list: [helper.Media.destination.check.isExist],
      update: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isGalleryExist,
        createMedia(mediaConfig.destination.gallery.Replace),
        helper.Media.destination.gallery.replace,
      ],
      deleteAll: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.gallery.deleteAll,
      ],
      deleteOne: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isGalleryExist,
      ],
    },

    facility: {
      add: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
        createMedia(mediaConfig.destination.facility.Add),
        helper.Media.destination.facility.save,
      ],
      list: [
        helper.Media.destination.check.isExist,
        helper.Media.destination.check.isFacilityExist,
      ],
      update: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
        helper.Media.destination.check.isFacilityPhotoExist,
        createMedia(mediaConfig.destination.facility.Replace),
        helper.Media.destination.facility.replace,
      ],
      deleteAll: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
      ],
      deleteOne: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
        helper.Media.destination.check.isFacilityPhotoExist,
      ],
    },

    attraction: {
      add: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isAttractionExist,
        createMedia(mediaConfig.destination.attraction.Add),
        helper.Media.attraction.photo.save,
      ],
      list: [
        helper.Media.destination.check.isExist,
        helper.Media.destination.check.isAttractionExist,
      ],
      update: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isAttractionExist,
        helper.Media.destination.check.isAttractionPhotoExist,
        createMedia(mediaConfig.destination.attraction.Replace),
        helper.Media.attraction.photo.replace,
      ],
      deleteAll: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isAttractionExist,
      ],
      deleteOne: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isAttractionExist,
        helper.Media.destination.check.isAttractionPhotoExist,
      ],
    },
  },
};
