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
    page: validate.number().min(1).positive().default(1),
    size: validate.number().min(1).max(100).positive().default(10),
    sort: validate.string().valid('asc', 'desc').default('desc'),
    role: validate.string().valid('admin', 'manager'),
    sortBy: validate
      .string()
      .valid('username', 'email', 'name', 'createdAt', 'adminId')
      .default('createdAt'),
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
