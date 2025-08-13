import { authHelper } from '#helpers/data/auth.mjs';
import { adminHelper } from '#helpers/data/admin.mjs';
import { destinationHelper } from '#helpers/data/destination.mjs';
import { attractionHelper } from '#helpers/data/attraction.mjs';
import { recommendationHelper } from '#helpers/data/recommendation.mjs';
import { admin } from '#helpers/media/admin.mjs';
import { destination } from '#helpers/media/destination.mjs';
import { attraction } from '#helpers/media/attraction.mjs';
import { facility } from '#helpers/media/facility.mjs';

export const helper = {
  Data: {
    auth: {
      register: authHelper.create,
      signIn: authHelper.login,
    },

    admin: {
      list: adminHelper.listAdmins,
      update: adminHelper.updateAdmin,
    },

    manager: {
      update: adminHelper.updateManager,
    },

    destination: {
      create: destinationHelper.create,
      get: destinationHelper.get,
      list: destinationHelper.list,
      update: destinationHelper.patch,
      recommendation: recommendationHelper.show,
    },

    attraction: {
      create: attractionHelper.create,
      update: attractionHelper.patch,
      validateAccess: attractionHelper.validateAccess,
      destinationOwner: attractionHelper.destinationOwner,
    },
  },

  Media: {
    admin: {
      checkIsExist: admin.checkIsExist,
      photo: {
        save: admin.photo.save,
      },
    },

    destination: {
      check: {
        isExist: destination.check.isExist,
        isAdminOwned: destination.check.isAdminOwned,
        isGalleryExist: destination.check.isGalleryExist,
        isFacilityExist: destination.check.isFacilityExist,
        isFacilityPhotoExist: destination.check.isFacilityPhotoExist,
        isAttractionExist: destination.check.isAttractionExist,
        isAttractionPhotoExist: destination.check.isAttractionPhotoExist,
      },

      photos: {
        save: destination.photos.save,
      },

      gallery: {
        save: destination.gallery.save,
        replace: destination.gallery.replace,
        deleteAll: destination.gallery.deleteAll,
        deleteOne: destination.gallery.deleteOne,
      },

      facility: {
        save: facility.photo.save,
        replace: facility.photo.replace,
      },

      cleanupFile: destination.cleanupFile,
    },

    attraction: {
      photo: {
        save: attraction.photo.save,
        replace: attraction.photo.replace,
      },

      cleanupFile: attraction.cleanupFile,
    },
  },
};
