import { validations } from '#validations/index.mjs';
import { checker } from '#validations/utils/checker.mjs';
import { helper } from '#helpers/index.mjs';

export const authData = {
  register: async (request) => {
    validations.check.isNotEmpty(request);
    const validatedRequest = validations.check.request(checker.auth.register, request);

    const savedAdmin = await helper.Data.auth.register(validatedRequest);

    const { password, _id, __v, ...result } = savedAdmin.toObject();
    return result;
  },

  signin: async (request) => {
    const loginRequest = validations.check.request(checker.auth.signIn, request);

    const result = await helper.Data.auth.signIn(loginRequest);

    return result;
  },
};
