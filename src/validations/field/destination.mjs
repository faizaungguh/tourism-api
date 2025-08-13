import validate from 'joi';
import { validate as validationHelper } from '#validations/validation.mjs';

export const field = {
  adminId: validate.string().messages({
    'any.required': 'ID Admin wajib diisi.',
  }),

  destinationTitle: validate.string().trim().custom(validationHelper.sanitizer.string).messages({
    'string.empty': 'Judul destinasi tidak boleh kosong.',
  }),

  categories: validate.string().trim().messages({
    'string.base': 'Kategori harus berupa teks.',
    'string.empty': 'Kategori tidak boleh kosong.',
    'any.required': 'Kategori wajib diisi.',
  }),

  description: validate.string().custom(validationHelper.sanitizer.string).messages({
    'string.empty': 'Deskripsi tidak boleh kosong.',
  }),

  locations: validate.object({
    addresses: validate.string().uri().messages({
      'string.empty': 'Alamat tidak boleh kosong.',
      'any.required': 'Alamat wajib diisi.',
    }),
    link: validate.string().custom(validationHelper.sanitizer.string).messages({
      'string.empty': 'Tautan tidak boleh kosong.',
      'any.required': 'Tautan wajib diisi.',
    }),
    subdistrict: validate.string().trim().required().messages({
      'string.base': 'Kecamatan harus berupa teks.',
      'string.empty': 'Kecamatan tidak boleh kosong.',
      'any.required': 'Kecamatan wajib diisi.',
    }),
    coordinates: validate
      .object({
        lat: validate.number(),
        long: validate.number(),
      })
      .required()
      .messages({ 'any.required': 'Kecamatan wajib diisi.' }),
  }),

  openingHour: validate.array().items(
    validate.object({
      day: validate
        .string()
        .valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
        .messages({
          'any.only':
            'Hari harus salah satu dari: monday, tuesday, wednesday, thursday, friday, saturday, sunday.',
          'any.required': 'Hari wajib diisi.',
        }),
      hours: validate.string().optional().allow(''),
      isClosed: validate.boolean().default(false),
      _deleted: validate.boolean().optional(),
    }),
  ),

  facility: validate.array().items(
    validate.object({
      name: validate.string().trim().custom(validationHelper.sanitizer.string).messages({
        'string.empty': 'Nama fasilitas tidak boleh kosong.',
        'any.required': 'Nama fasilitas wajib diisi.',
      }),
      availability: validate.boolean().default(false),
      number: validate.number().integer().min(0).default(0).messages({
        'number.base': 'Jumlah fasilitas harus berupa angka.',
        'number.integer': 'Jumlah fasilitas harus berupa bilangan bulat.',
        'number.min': 'Jumlah fasilitas tidak boleh kurang dari 0.',
      }),
      disabilityAccess: validate.boolean().default(false),
      photo: validate.array().items(validate.string().uri()).default([]),
      _deleted: validate.boolean().optional(),
    }),
  ),

  contact: validate.array().items(
    validate.object({
      platform: validate
        .string()
        .valid(
          'phone',
          'whatsapp',
          'email',
          'website',
          'instagram',
          'facebook',
          'twitter',
          'tiktok',
        )
        .messages({
          'any.only': 'Platform kontak tidak valid.',
          'any.required': 'Platform kontak wajib diisi.',
        }),
      value: validate.string().trim().custom(validationHelper.sanitizer.string).messages({
        'string.empty': 'Nilai kontak tidak boleh kosong.',
        'any.required': 'Nilai kontak wajib diisi.',
      }),
      _deleted: validate.boolean().optional(),
    }),
  ),

  ticket: validate.object({
    adult: validate.number().min(0).default(0).messages({
      'number.base': 'Harga tiket dewasa harus berupa angka.',
      'number.min': 'Harga tiket dewasa tidak boleh kurang dari 0.',
      'any.required': 'Harga tiket dewasa wajib diisi.',
    }),
    child: validate.number().min(0).default(0).messages({
      'number.base': 'Harga tiket anak-anak harus berupa angka.',
      'number.min': 'Harga tiket anak-anak tidak boleh kurang dari 0.',
      'any.required': 'Harga tiket anak-anak wajib diisi.',
    }),
    disability: validate.number().min(0).default(0).messages({
      'number.base': 'Harga tiket disabilitas harus berupa angka.',
      'number.min': 'Harga tiket disabilitas tidak boleh kurang dari 0.',
      'any.required': 'Harga tiket disabilitas wajib diisi.',
    }),
  }),

  patchTicket: validate.object({
    adult: validate.number().min(0).messages({
      'number.base': 'Harga tiket dewasa harus berupa angka.',
      'number.min': 'Harga tiket dewasa tidak boleh kurang dari 0.',
    }),
    child: validate.number().min(0).messages({
      'number.base': 'Harga tiket anak-anak harus berupa angka.',
      'number.min': 'Harga tiket anak-anak tidak boleh kurang dari 0.',
    }),
    disability: validate.number().min(0).messages({
      'number.base': 'Harga tiket disabilitas harus berupa angka.',
      'number.min': 'Harga tiket disabilitas tidak boleh kurang dari 0.',
    }),
  }),

  parking: validate.object({
    motorcycle: validate.object({
      capacity: validate.number().integer().min(0),
      price: validate.number().min(0),
    }),
    car: validate.object({
      capacity: validate.number().integer().min(0),
      price: validate.number().min(0),
    }),
    bus: validate.object({
      capacity: validate.number().integer().min(0),
      price: validate.number().min(0),
    }),
  }),
};
