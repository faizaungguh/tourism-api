import * as validate from '#validations/validate.mjs';
import { checker } from '#validations/auth.mjs';
import * as authHelper from '#helpers/data/authHelper.mjs';

export const authService = {
  register: async (request) => {
    validate.isNotEmpty(request);
    const validatedRequest = validate.requestCheck(checker.register, request);

    const savedAdmin = await authHelper.createManager(validatedRequest);

    const { password, _id, __v, ...result } = savedAdmin.toObject();
    return result;
  },

  signin: async (request) => {
    const loginRequest = validate.requestCheck(checker.login, request);

    const result = await authHelper.login(loginRequest);

    return result;
  },
};
