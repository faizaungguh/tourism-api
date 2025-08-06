import { admin } from '#controllers/media/admin.mjs';
import { destination } from '#controllers/media/destination.mjs';
import { facility } from '#controllers/media/facility.mjs';
import { attraction } from '#controllers/media/attraction.mjs';

export const media = {
  admin: {
    addProfile: admin.profileMedia,
  },

  /** Destinasi Media */
  destination: {
    updateMedia: destination.photoMedia,

    gallery: {
      add: destination,
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
