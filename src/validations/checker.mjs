import { authCheck } from '#validations/data/auth.mjs';
import { adminCheck } from '#validations/data/admin.mjs';
import { categoryChecker } from '#validations/data/category.mjs';
import { subdistrictChecker } from '#validations/data/subdistrict.mjs';
import { destinationChecker } from '#validations/data/destination.mjs';
import { attractionChecker } from '#validations/data/attraction.mjs';

export const checker = {
  auth: {
    signIn: authCheck.login,
    register: authCheck.register,
  },

  admin: {
    create: adminCheck.create,
    list: adminCheck.list,
    update: adminCheck.patch,
  },

  category: {
    create: categoryChecker.valid,
    list: categoryChecker.list,
    update: categoryChecker.valid,
  },

  subdistrict: {
    create: subdistrictChecker.valid,
    list: subdistrictChecker.list,
    update: subdistrictChecker.valid,
  },

  destination: {
    create: destinationChecker.valid,
    list: destinationChecker.list,
    update: destinationChecker.patch,
  },

  attraction: {
    create: attractionChecker.create,
    update: attractionChecker.patch,
  },
};
