import { auth as authData } from '#controllers/data/auth.mjs';
import { admin as adminData } from '#controllers/data/admin.mjs';
import { manager as managerData } from '#controllers/data/manager.mjs';
import { category as categoryData } from '#controllers/data/category.mjs';
import { subdistrict as subdistrictData } from '#controllers/data/subdistrict.mjs';
import { destination as destinationData } from '#controllers/data/destination.mjs';
import { attraction as attractionData } from '#controllers/data/attraction.mjs';
import { recommendation as recommendationData } from '#controllers/data/recommendation.mjs';

export const data = {
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
    recommendation: recommendationData,
  },

  attraction: {
    add: attractionData.post,
    update: attractionData.update,
    delete: attractionData.drop,
  },
};
