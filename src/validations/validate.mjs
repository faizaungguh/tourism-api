import { ResponseError } from '../errors/responseError.mjs';
import mongoose from 'mongoose';

export const requestCheck = (schema, request) => {
  const { error, value } = schema.validate(request, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true,
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

export const isNotEmpty = (request) => {
  if (!request || Object.keys(request).length === 0) {
    throw new ResponseError(400, 'Kesalahan pengiriman', {
      message: 'Request body tidak boleh kosong.',
    });
  }
};

export const isValidId = (id) => {
  if (!id) {
    throw new ResponseError(400, 'Id kosong', {
      message: 'Anda harus menyertakan Id',
    });
  }
  /** validasi apakah id yang dikirimkan adalah object id yang valid */
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ResponseError(400, 'Id tidak valid', {
      message: 'Anda harus menyertakan Id yang valid',
    });
  }
};
