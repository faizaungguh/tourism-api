import { admin } from '#controllers/media/admin.mjs';
import { destination } from '#controllers/media/destination.mjs';
import { facility } from '#controllers/media/facility.mjs';
import { attraction } from '#controllers/media/attraction.mjs';

export const media = {
  admin: {
    addProfile: admin.profileMedia,
    getProfile: admin.getProfileMedia,
  },

  /** Destinasi Media */
  destination: {
    updateMedia: destination.photoMedia,

    gallery: {
      add: destination.addGallery,
      get: destination.getGallery,
      deleteAll: destination.dropAllGallery,
      update: destination.patchGallery,
      delete: destination,
    },
  },

  facility: {
    add: facility,
    get: facility,
    update: facility,
    deleteAll: facility,
    delete: facility,
  },

  /** Wahana Media */
  attraction: {
    add: attraction,
    get: attraction,
    update: attraction,
    deleteAll: attraction,
    delete: attraction,
  },
};
