import multer from 'multer';
import { ResponseError } from '#errors/responseError.mjs';
import { general as generalHelper } from '#helpers/media/general.mjs';
import { admin as adminHelper } from '#helpers/media/admin.mjs';
import { destination as destinationHelper } from '#helpers/media/destination.mjs';
import { facility as facilityHelper } from '#helpers/media/facility.mjs';

const baseMulter = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(
        new ResponseError(415, 'Ekstensi tidak didukung', {
          photo:
            'Dokumen yang didukung adalah berupa gambar dengan ekstensi seperti .jpg, .png, dan sebagainya.',
        })
      );
    }
  },
};

const createMedia = (uploader, limits) => (req, res, next) => {
  uploader(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      switch (err.code) {
        case 'LIMIT_FILE_SIZE':
          return next(
            new ResponseError(413, 'Dokumen terlalu besar', {
              photo: `Ukuran dokumen yang Anda kirim terlalu besar, ukuran maksimal ${
                limits.fileSize / 1024
              }KB.`,
            })
          );
        case 'LIMIT_UNEXPECTED_FILE':
          return next(
            new ResponseError(422, 'Dokumen tidak diterima', {
              photo: `Hanya satu file dengan nama field 'photo' yang diizinkan.`,
            })
          );
        default:
          return next(new ResponseError(422, `Gagal mengunggah file: ${err.code}`, err.message));
      }
    } else if (err) {
      return next(err);
    }
    next();
  });
};

const admin = {
  Media: {
    limits: { fileSize: 1024 * 200 },
    get uploader() {
      return multer({
        ...baseMulter,
        limits: this.limits,
      }).single('photo');
    },
  },
};

const destination = {
  Media: {
    limits: { fileSize: 1024 * 200 },
    get uploader() {
      return multer({
        ...baseMulter,
        limits: this.limits,
      }).fields([
        { name: 'profilePhoto', maxCount: 1 },
        { name: 'headlinePhoto', maxCount: 1 },
      ]);
    },
  },

  gallery: {
    add: {
      limits: { fileSize: 1024 * 200 },
      get uploader() {
        return multer({
          ...baseMulter,
          limits: this.limits,
        }).array('galleryPhoto', 8);
      },
    },

    replace: {
      limits: { fileSize: 1024 * 200 },
      get uploader() {
        return multer({
          ...baseMulter,
          limits: this.limits,
        }).single('galleryPhoto');
      },
    },
  },

  facility: {
    add: {
      limits: { fileSize: 1024 * 200 },
      get uploader() {
        return multer({
          ...baseMulter,
          limits: this.limits,
        }).array('photo', 6);
      },
    },

    replace: {
      limits: { fileSize: 1024 * 200 },
      get uploader() {
        return multer({
          ...baseMulter,
          limits: this.limits,
        }).single('photo');
      },
    },
  },

  attraction: {
    add: {
      limits: { fileSize: 1024 * 200 },
      get uploader() {
        return multer({
          ...baseMulter,
          limits: this.limits,
        }).array('photo', 6);
      },
    },

    replace: {
      limits: { fileSize: 1024 * 200 },
      get uploader() {
        return multer({
          ...baseMulter,
          limits: this.limits,
        }).single('photo');
      },
    },
  },
};

export const handleMedia = {
  admin: {
    updateMedia: [
      adminHelper.checkIsExist,
      createMedia(admin.Media.uploader, admin.Media.limits),
      adminHelper.photo.save({
        subfolder: 'profile',
        getDynamicPath: (req) => req.params.id,
      }),
    ],
    get: [adminHelper.checkIsExist],
  },

  destination: {
    updateMedia: [
      destinationHelper.checkIsExist,
      generalHelper.checkIsOwner.destination,
      createMedia(destination.Media.uploader, destination.Media.limits),
      destinationHelper.photos.save,
    ],

    gallery: {
      add: [
        generalHelper.checkIsOwner.destination,
        createMedia(destination.gallery.add.uploader, destination.gallery.add.limits),
        destinationHelper.gallery.save,
      ],
      get: [destinationHelper.checkIsExist],
      update: [
        destinationHelper.checkIsExist,
        generalHelper.checkIsOwner.destination,
        destinationHelper.gallery.checkIsExist,
        createMedia(destination.gallery.replace.uploader, destination.gallery.replace.limits),
        destinationHelper.gallery.replace,
      ],
      delete: [destinationHelper.checkIsExist, generalHelper.checkIsOwner.destination],
    },

    facility: {
      add: [
        generalHelper.checkIsOwner.destination,
        facilityHelper.isExist,
        createMedia(destination.facility.add.uploader, destination.facility.add.limits),
        facilityHelper.photo.replace,
      ],
      get: [generalHelper.checkIsOwner],
      update: [
        generalHelper.checkIsOwner.destination,
        createMedia(destination.facility.replace.uploader, destination.facility.replace.limits),
      ],
      delete: [],
    },

    attraction: {
      add: [
        generalHelper.checkIsOwner.destination,
        createMedia(destination.attraction.add.uploader, destination.attraction.add.limits),
      ],
      get: [destinationHelper.checkIsExist],
      update: [
        generalHelper.checkIsOwner.destination,
        createMedia(destination.attraction.replace.uploader, destination.attraction.replace.limits),
      ],
      delete: [generalHelper.checkIsOwner.destination],
    },
  },
};
