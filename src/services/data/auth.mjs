import { validate } from '#validations/validate.mjs';
import { checker } from '#validations/checker.mjs';
import { helper } from '#helpers/helper.mjs';

export const authService = {
  register: async (request) => {
    validate.check.isNotEmpty(request);
    const validatedRequest = validate.check.request(checker.auth.register, request);

    const savedAdmin = await helper.Data.auth.register(validatedRequest);

    const { password, _id, __v, ...result } = savedAdmin.toObject();
    return result;
  },

  signin: async (request) => {
    const loginRequest = validate.check.request(checker.auth.signIn, request);

    const result = await helper.Data.auth.signIn(loginRequest);

    return result;
  },
};
