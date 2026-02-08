import validate from 'joi';
import { validations } from '#validations/index.mjs';

export const field = {
  username: validate.string().alphanum().min(5).max(12).required().messages({
    'string.base': 'Username hanya diperbolehkan berupa teks.',
    'string.alphanum': 'Username hanya boleh berisi huruf dan angka saja.',
    'string.empty': 'Username harus diisi.',
    'string.min': 'Username minimal terdiri dari 5 karakter.',
    'string.max': 'Username maksimal terdiri dari 12 karakter.',
    'any.required': 'Username wajib diisi',
  }),
  name: validate.string().custom(validations.sanitizer.string).required().messages({
    'string.empty': 'Name tidak boleh kosong.',
    'any.required': 'Name wajib diisi',
  }),
  password: validate
    .string()
    .min(6)
    .required()
    .pattern(new RegExp('^[a-zA-Z0-9#@$&]+$'))
    .required()
    .messages({
      'string.base': 'Password harus berupa huruf, angka, dan karakter #, @, $, &',
      'string.empty': 'Password tidak boleh kosong',
      'string.min': 'Password minimal harus memiliki 6 karakter',
      'string.pattern.base': 'Password hanya boleh berisi huruf, angka, dan karakter #, @, $, &',
      'any.required': 'Password wajib diisi',
    }),
  email: validate
    .string()
    .custom(validations.sanitizer.email)
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .required()
    .messages({
      'string.base': 'Email harus berupa teks',
      'string.empty': 'Email tidak boleh kosong',
      'string.email': 'Format email tidak valid, misal admin@gmail.com',
      'string.pattern.base': 'Email mengandung karakter yang tidak diizinkan.',
      'any.required': 'Email wajib diisi',
    }),
  contactNumber: validate
    .string()
    .pattern(/^08[0-9]{8,11}$/)
    .min(6)
    .required()
    .messages({
      'string.base': 'Nomor kontak harus berupa teks',
      'string.empty': 'Nomor kontak tidak boleh kosong',
      'string.min': 'Nomor kontak minimal 8 digit',
      'string.pattern.base': 'Format nomor kontak tidak valid. Contoh: 081234567890',
      'any.required': 'Nomor kontak wajib diisi',
    }),

  /** PATCH */
  patchUsername: validate.string().alphanum().min(5).max(12).messages({
    'string.base': 'Username hanya diperbolehkan berupa teks.',
    'string.alphanum': 'Username hanya boleh berisi huruf dan angka saja.',
    'string.min': 'Username minimal terdiri dari 5 karakter.',
    'string.max': 'Username maksimal terdiri dari 12 karakter.',
  }),
  patchName: validate.string().custom(validations.sanitizer.string).required().messages({
    'string.empty': 'Name tidak boleh kosong.',
    'string.pattern.base': 'Nama kategori tidak boleh mengandung skrip atau tag HTML.',
    'any.required': 'Name wajib diisi',
  }),
  patchEmail: validate
    .string()
    .email({ tlds: { allow: false } })
    .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .messages({
      'string.base': 'Email harus berupa teks',
      'string.email': 'Format email tidak valid, misal admin@gmail.com',
      'string.pattern.base': 'Email mengandung karakter yang tidak diizinkan.',
    }),
  patchContactNumber: validate
    .string()
    .pattern(/^08[0-9]{8,11}$/)
    .min(6)
    .messages({
      'string.base': 'Nomor kontak harus berupa teks',
      'string.min': 'Nomor kontak minimal 8 digit',
      'string.pattern.base': 'Format nomor kontak tidak valid. Contoh: 081234567890',
    }),
  oldPassword: validate.string().min(6).pattern(new RegExp('^[a-zA-Z0-9#@$&]+$')).messages({
    'string.base': 'Password harus berupa huruf, angka, dan karakter #, @, $, &',
    'string.min': 'Password minimal harus memiliki 6 karakter',
    'string.pattern.base': 'Password hanya boleh berisi huruf, angka, dan karakter #, @, $, &',
    'string.empty': 'Masukkan Password Lama anda.',
  }),
  newPassword: validate.string().min(6).pattern(new RegExp('^[a-zA-Z0-9#@$&]+$')).messages({
    'string.base': 'Password harus berupa huruf, angka, dan karakter #, @, $, &',
    'string.empty': 'Masukkan Password Baru anda.',
    'string.min': 'Password minimal harus memiliki 6 karakter',
    'string.pattern.base': 'Password hanya boleh berisi huruf, angka, dan karakter #, @, $, &',
  }),

  /** list */
  page: validate.number().min(1).positive().default(1),
  size: validate.number().min(1).max(100).positive().default(10),
  sort: validate.string().valid('asc', 'desc').default('desc'),
  role: validate.string().valid('admin', 'manager'),
  sortBy: validate
    .string()
    .valid('username', 'email', 'name', 'createdAt', 'adminId')
    .default('createdAt'),
};
