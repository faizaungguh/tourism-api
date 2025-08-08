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
      add: destination.gallery.add,
      get: destination.gallery.get,
      deleteAll: destination.gallery.dropAll,
      update: destination.gallery.update,
      delete: destination.gallery.dropOne,
    },
  },

  facility: {
    add: facility.add,
    get: facility.get,
    update: facility.update,
    deleteAll: facility.dropAll,
    delete: facility.dropOne,
  },

  /** Wahana Media */
  attraction: {
    add: attraction.add,
    get: attraction.get,
    update: attraction.update,
    deleteAll: attraction.dropAll,
    delete: attraction.dropOne,
  },
};
