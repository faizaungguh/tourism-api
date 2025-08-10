import validate from 'joi';
import { field } from '#validations/field/admin.mjs';

export const checker = {
  register: validate.object({
    username: field.username,
    password: field.password,
    name: field.name,
    email: field.email,
    contactNumber: field.contactNumber,
  }),

  login: validate.object({
    username: validate.string().required().messages({
      'string.empty': 'username tidak boleh kosong',
      'any.required': 'username tidak boleh kosong',
    }),
    password: validate.string().required().messages({
      'string.empty': 'password harus diisi',
      'any.required': 'password harus diisi',
    }),
  }),
};
