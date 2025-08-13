import { adminData } from '#services/data/data.admin.mjs';
import { authData } from '#services/data/data.auth.mjs';
import { managerData } from '#services/data/data.manager.mjs';
import { categoryData } from '#services/data/data.category.mjs';
import { subdistrictData } from '#services/data/data.subdistrict.mjs';
import { destinationData } from '#services/data/data.destination.mjs';
import { attractionData } from '#services/data/data.attraction.mjs';
import { recommendationData } from '#services/data/data.recommendation.mjs';

import { adminMedia } from '#services/media/media.admin.mjs';
import { destinationMedia } from '#services/media/media.destination.mjs';
import { facilityMedia } from '#services/media/media.facility.mjs';
import { attractionMedia } from '#services/media/media.attraction.mjs';

export const dataService = {
  auth: {
    register: authData.register,
    signIn: authData.signin,
  },

  admin: {
    add: adminData.post,
    list: adminData.list,
    detail: adminData.detail,
    update: adminData.update,
    delete: adminData.drop,
  },

  manager: {
    list: managerData.list,
    detail: managerData.detail,
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
    detail: destinationData.detail,
    update: destinationData.update,
    delete: destinationData.drop,
    showRecomendation: recommendationData.show,
    raw: recommendationData.raw,
  },

  attraction: {
    add: attractionData.post,
    update: attractionData.update,
    delete: attractionData.drop,
  },
};

export const mediaService = {
  admin: {
    updatePhoto: adminMedia.profilePhoto,
    getProfilePhoto: adminMedia.getProfilePhoto,
  },

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
};
