import { authData } from '#controllers/data/data.auth.mjs';
import { adminData } from '#controllers/data/data.admin.mjs';
import { managerData } from '#controllers/data/data.manager.mjs';
import { categoryData } from '#controllers/data/data.category.mjs';
import { subdistrictData } from '#controllers/data/data.subdistrict.mjs';
import { destinationData } from '#controllers/data/data.destination.mjs';
import { attractionData } from '#controllers/data/data.attraction.mjs';
import { recommendationData } from '#controllers/data/data.recommendation.mjs';

import { adminMedia } from '#controllers/media/media.admin.mjs';
import { destinationMedia } from '#controllers/media/media.destination.mjs';
import { facilityMedia } from '#controllers/media/media.facility.mjs';
import { attractionMedia } from '#controllers/media/media.attraction.mjs';

export const Control = {
  Data: {
    auth: {
      register: authData.register,
      signin: authData.signin,
      signout: authData.signout,
    },

    admin: {
      add: adminData.post,
      list: adminData.list,
      get: adminData.get,
      update: adminData.update,
      delete: adminData.drop,
    },

    manager: {
      list: managerData.list,
      get: managerData.get,
      update: managerData.update,
      delete: managerData.drop,
    },

    category: {
      add: categoryData.post,
      list: categoryData.list,
      update: categoryData.update,
      delete: categoryData.drop,
    },

    subdistrict: {
      add: subdistrictData.post,
      list: subdistrictData.list,
      update: subdistrictData.update,
      delete: subdistrictData.drop,
    },

    destination: {
      add: destinationData.post,
      list: destinationData.list,
      get: destinationData.detail,
      update: destinationData.update,
      delete: destinationData.drop,
      showRecommendation: recommendationData.show,
      getRaw: recommendationData.raw,
    },

    attraction: {
      add: attractionData.post,
      update: attractionData.update,
      delete: attractionData.drop,
    },
  },
  Media: {
    admin: {
      addProfile: adminMedia.profileMedia,
      getProfile: adminMedia.getProfileMedia,
    },

    /** Destinasi Media */
    destination: {
      updateMedia: destinationMedia.photoMedia,

      gallery: {
        add: destinationMedia.gallery.add,
        list: destinationMedia.gallery.list,
        deleteAll: destinationMedia.gallery.dropAll,
        update: destinationMedia.gallery.update,
        delete: destinationMedia.gallery.dropOne,
      },

      facility: {
        add: facilityMedia.add,
        list: facilityMedia.list,
        update: facilityMedia.update,
        deleteAll: facilityMedia.dropAll,
        delete: facilityMedia.dropOne,
      },

      /** Wahana Media */
      attraction: {
        add: attractionMedia.add,
        list: attractionMedia.list,
        update: attractionMedia.update,
        deleteAll: attractionMedia.dropAll,
        delete: attractionMedia.dropOne,
      },
    },
  },
};
