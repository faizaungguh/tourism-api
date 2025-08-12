import mongoose from 'mongoose';
import validator from 'validator';
import { ResponseError } from '#errors/responseError.mjs';

const sanitizeHtml = (value) => {
  return validator.escape(value.trim());
};

export const validate = {
  check: {
    request: (schema, request) => {
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
        throw new ResponseError(422, 'Proses dihentikan', validationErrors);
      } else {
        return value;
      }
    },

    isNotEmpty: (request) => {
      if (!request || Object.keys(request).length === 0) {
        throw new ResponseError(422, 'Data tidak lengkap', {
          message: 'Request body tidak boleh kosong.',
        });
      }
    },

    isValidId: (id) => {
      if (!id) {
        throw new ResponseError(422, 'Data tidak lengkap', {
          message: 'Anda harus menyertakan Id',
        });
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ResponseError(422, 'Data tidak lengkap', {
          message: 'Anda harus menyertakan Id yang valid',
        });
      }
    },
  },

  sanitizer: {
    string: (value, helpers) => {
      const sanitizedValue = sanitizeHtml(value);
      return sanitizedValue;
    },
  },
};
