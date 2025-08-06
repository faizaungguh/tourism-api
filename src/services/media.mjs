import { adminService as admin } from '#services/media/admin.mjs';
import { destinationService as destination } from '#services/media/destination.mjs';
import { facility } from '#services/media/facility.mjs';
import { attraction } from '#services/media/attraction.mjs';

export const mediaService = {
  admin: {
    updatePhoto: admin.profilePhoto,
    getProfilePhoto: admin.getProfilePhoto,
  },

  destination: {
    updateMedia: destination.photoMedia,

    gallery: {
      add: destination.addGallery,
      list: destination,
      get: destination,
      update: destination,
      deleteAll: destination,
      delete: destination,
    },
  },

  facility: {
    add: facility,
    list: facility,
    get: facility,
    update: facility,
    deleteAll: facility,
    delete: facility,
  },

  /** Wahana Media */
  attraction: {
    add: attraction,
    list: attraction,
    get: attraction,
    update: attraction,
    deleteAll: attraction,
    delete: attraction,
  },
};
