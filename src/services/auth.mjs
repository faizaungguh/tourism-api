import * as validate from '#validations/validate.mjs';
import { validation } from '#validations/auth.mjs';
import * as authHelper from '#helpers/authHelper.mjs';

export const authService = {
  register: async (request) => {
    validate.isNotEmpty(request);
    const validatedRequest = validate.requestCheck(
      validation.register,
      request
    );

    const savedAdmin = await authHelper.createManager(validatedRequest);

    const { password, ...result } = savedAdmin.toObject();
    return result;
  },

  signin: async (request) => {
    const loginRequest = validate.requestCheck(validation.login, request);

    const result = await authHelper.login(loginRequest);

    return result;
  },
};
