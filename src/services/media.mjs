import { adminService as admin } from '#services/media/admin.mjs';
import { destinationService as destination } from '#services/media/destination.mjs';
import { facilityService as facility } from '#services/media/facility.mjs';
import { attractionService as attraction } from '#services/media/attraction.mjs';

export const mediaService = {
  admin: {
    updatePhoto: admin.profilePhoto,
    getProfilePhoto: admin.getProfilePhoto,
  },

  destination: {
    updateMedia: destination.photoMedia,

    gallery: {
      add: destination.gallery.add,
      list: destination.gallery.list,
      deleteAll: destination.gallery.dropAll,
      update: destination.gallery.update,
      delete: destination.gallery.dropOne,
    },

    facility: {
      add: facility.add,
      list: facility.list,
      update: facility.update,
      deleteAll: facility.dropAll,
      delete: facility.dropOne,
    },

    /** Wahana Media */
    attraction: {
      add: attraction.add,
      list: attraction.list,
      update: attraction.update,
      deleteAll: attraction.dropAll,
      delete: attraction.dropOne,
    },
  },
};
