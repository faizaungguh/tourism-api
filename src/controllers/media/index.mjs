import { admin } from '#controllers/media/media.admin.mjs';
import { destination } from '#controllers/media/media.destination.mjs';
import { facility } from '#controllers/media/media.facility.mjs';
import { attraction } from '#controllers/media/media.attraction.mjs';

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
