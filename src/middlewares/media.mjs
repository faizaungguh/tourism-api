import multer from 'multer';
import { ResponseError } from '#errors/responseError.mjs';
import { helper } from '#helpers/helper.mjs';

const baseMulter = {
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
      callback(null, true);
    } else {
      callback(
        new ResponseError(415, 'Data tidak diproses', {
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
            new ResponseError(413, 'Data tidak diproses', {
              photo: `Ukuran dokumen yang Anda kirim terlalu besar, ukuran maksimal ${
                limits.fileSize / 1024
              }KB.`,
            })
          );
        case 'LIMIT_UNEXPECTED_FILE':
          return next(
            new ResponseError(422, 'Proses dihentikan', {
              photo: `Hanya satu file dengan nama field 'photo' yang diizinkan.`,
            })
          );
        default:
          return next(new ResponseError(422, `Proses dihentikan`, err.message));
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
      helper.Media.admin.checkIsExist,
      createMedia(admin.Media.uploader, admin.Media.limits),
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
      createMedia(destination.Media.uploader, destination.Media.limits),
      helper.Media.destination.photos.save,
    ],

    gallery: {
      add: [
        helper.Media.destination.check.isAdminOwned,
        createMedia(destination.gallery.add.uploader, destination.gallery.add.limits),
        helper.Media.destination.gallery.save,
      ],
      list: [helper.Media.destination.check.isExist],
      update: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isGalleryExist,
        createMedia(destination.gallery.replace.uploader, destination.gallery.replace.limits),
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
        createMedia(destination.facility.add.uploader, destination.facility.add.limits),
        helper.Media.destination.facility.save,
      ],
      list: [
        helper.Media.destination.check.isExist,
        helper.Media.destination.check.isFacilityExist,
      ],
<<<<<<< HEAD
=======
      list: [
        helper.Media.destination.check.isExist,
        helper.Media.destination.check.isFacilityExist,
      ],
>>>>>>> 6f11789d166c45f55c4b053c88903a816ef9d41f
      update: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
        helper.Media.destination.check.isFacilityPhotoExist,
        createMedia(destination.facility.replace.uploader, destination.facility.replace.limits),
        helper.Media.destination.facility.replace,
      ],
      deleteAll: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
      ],
<<<<<<< HEAD
=======
      deleteAll: [
        helper.Media.destination.check.isAdminOwned,
        helper.Media.destination.check.isFacilityExist,
      ],
>>>>>>> 6f11789d166c45f55c4b053c88903a816ef9d41f
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
        createMedia(destination.attraction.add.uploader, destination.attraction.add.limits),
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
        createMedia(destination.attraction.replace.uploader, destination.attraction.replace.limits),
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
