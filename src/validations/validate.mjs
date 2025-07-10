import { ResponseError } from '../errors/responseError.mjs';

export const validate = (schema, request) => {
  const { error, value } = schema.validate(request, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    const validationErrors = {};
    error.details.forEach((detail) => {
      const key = detail.path[0];
      validationErrors[key] = detail.message;
    });
    throw new ResponseError(
      422,
      'Data yang diberikan tidak valid',
      validationErrors
    );
  } else {
    return value;
  }
};
