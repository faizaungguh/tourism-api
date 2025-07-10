import validate from 'joi';

export const adminValidation = validate.object({
  username: validate.string().alphanum().min(5).max(12).required().messages({
    'string.base': 'Username hanya diperbolehkan berupa teks.',
    'string.alphanum': 'Username hanya boleh berisi huruf dan angka saja.',
    'string.empty': 'Username harus diisi.',
    'string.min': 'Username minimal terdiri dari 5 karakter.',
    'string.max': 'Username maksimal terdiri dari 12 karakter.',
    'any.required': 'Username wajib diisi',
  }),
  password: validate
    .string()
    .min(6)
    .required()
    .pattern(new RegExp('^[a-zA-Z0-9#@$&]+$'))
    .required()
    .messages({
      'string.base':
        'Password harus berupa huruf, angka, dan karakter #, @, $, &',
      'string.empty': 'Password tidak boleh kosong',
      'string.min': 'Password minimal harus memiliki 6 karakter',
      'string.pattern.base':
        'Password hanya boleh berisi huruf, angka, dan karakter #, @, $, &',
      'any.required': 'Password wajib diisi',
    }),
  name: validate.string().required().messages({
    'string.empty': 'Name tidak boleh kosong.',
    'any.required': 'Name wajib diisi',
  }),
  email: validate
    .string()
    .email({ tlds: { allow: false } })
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
      'string.pattern.base':
        'Format nomor kontak tidak valid. Contoh: 081234567890',
      'any.required': 'Nomor kontak wajib diisi',
    }),
  photo: validate.string().allow(''),
});
