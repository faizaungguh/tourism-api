import { adminService } from '#services/data/admin.mjs';
import { authService } from '#services/data/auth.mjs';
import { managerService } from '#services/data/manager.mjs';
import { categoryService } from '#services/data/category.mjs';
import { subdistrictService } from '#services/data/subdistrict.mjs';
import { destinationService } from '#services/data/destination.mjs';
import { attractionService } from '#services/data/attraction.mjs';

export const dataService = {
  auth: {
    register: authService.register,
    signIn: authService.signin,
  },

  admin: {
    add: adminService.post,
    list: adminService.list,
    detail: adminService.detail,
    update: adminService.update,
    delete: adminService.drop,
  },

  manager: {
    list: managerService.list,
    detail: managerService.detail,
    update: managerService.update,
    delete: managerService.drop,
  },

  category: {
    add: categoryService.post,
    list: categoryService.list,
    update: categoryService.update,
    delete: categoryService.drop,
  },

  subdistrict: {
    add: subdistrictService.post,
    list: subdistrictService.list,
    update: subdistrictService.update,
    delete: subdistrictService.drop,
  },

  destination: {
    add: destinationService.post,
    list: destinationService.list,
    detail: destinationService.detail,
    update: destinationService.update,
    delete: destinationService.drop,
  },

  attraction: {
    add: attractionService.post,
    update: attractionService.update,
    delete: attractionService.drop,
  },
};
