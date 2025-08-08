import multer from 'multer';
import { ResponseError } from '#errors/responseError.mjs';
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

const adminMedia = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).single('photo');
  },
};

const destinationMedia = {
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
};

const addGalleryDestination = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).array('galleryPhoto', 8);
  },
};

const updateGalleryDestination = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).single('galleryPhoto');
  },
};

const addFacilityPhotos = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).array('photo', 6);
  },
};

const updateFacilityPhoto = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).single('photo');
  },
};

const addAttractionPhotos = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).array('photo', 6);
  },
};

const updateAttractionPhoto = {
  limits: { fileSize: 1024 * 200 },
  get uploader() {
    return multer({
      ...baseMulter,
      limits: this.limits,
    }).single('photo');
  },
};

export const handleMedia = {
  admin: {
    updateMedia: [
      adminHelper.checkExist,
      createMedia(adminMedia.uploader, adminMedia.limits),
      adminHelper.savePhoto({
        subfolder: 'profile',
        getDynamicPath: (req) => req.params.id,
      }),
    ],
    get: [adminHelper.checkExist],
  },

  destination: {
    updateMedia: [
      destinationHelper.checkOwnership,
      createMedia(destinationMedia.uploader, destinationMedia.limits),
      destinationHelper.savePhotos,
    ],

    gallery: {
      add: [
        destinationHelper.checkOwnership,
        createMedia(addGalleryDestination.uploader, addGalleryDestination.limits),
        destinationHelper.saveGalleryPhotos,
      ],
      get: [destinationHelper.checkExist],
      update: [
        destinationHelper.checkOwnershipAndPhotoExist,
        createMedia(updateGalleryDestination.uploader, updateGalleryDestination.limits),
        destinationHelper.replaceGalleryPhoto,
      ],
      delete: [destinationHelper.checkOwnership],
    },

    facility: {
      add: [
        facilityHelper.checkOwnership,
        facilityHelper.isExist,
        createMedia(addFacilityPhotos.uploader, addFacilityPhotos.limits),
        facilityHelper.saveFacilityPhotos,
      ],
      get: [destinationHelper.checkExist],
      update: [
        destinationHelper.checkOwnership,
        createMedia(updateFacilityPhoto.uploader, updateFacilityPhoto.limits),
      ],
      delete: [destinationHelper.checkOwnership],
    },

    attraction: {
      add: [
        destinationHelper.checkOwnership,
        createMedia(addAttractionPhotos.uploader, addAttractionPhotos.limits),
      ],
      get: [destinationHelper.checkExist],
      update: [
        destinationHelper.checkOwnership,
        createMedia(updateAttractionPhoto.uploader, updateAttractionPhoto.limits),
      ],
      delete: [destinationHelper.checkOwnership],
    },
  },
};
