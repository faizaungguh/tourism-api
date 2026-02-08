import validate from 'joi';
import { field } from '#validations/field/admin.mjs';

export const adminCheck = {
  create: validate.object({
    username: field.username,
    password: field.password,
    name: field.name,
    email: field.email,
    contactNumber: field.contactNumber,
  }),

  list: validate.object({
    page: field.page,
    size: field.size,
    sort: field.sort,
    role: field.role,
    sortBy: field.sortBy,
  }),

  patch: validate
    .object({
      username: field.patchUsername,
      name: field.patchName,
      email: field.patchEmail,
      contactNumber: field.patchContactNumber,
      oldPassword: field.oldPassword,
      newPassword: field.newPassword,
    })
    .and('oldPassword', 'newPassword')
    .messages({
      'object.and':
        'Untuk mengubah password, Anda harus menyertakan password lama dan password baru.',
    }),
};
