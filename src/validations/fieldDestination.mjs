import validate from 'joi';

export const destinationTitleSchema = validate
  .string()
  .trim()
  .pattern(/^[^<>]*$/)
  .messages({
    'string.empty': 'Judul destinasi tidak boleh kosong.',
    'string.pattern.base':
      'Judul destinasi tidak boleh mengandung skrip atau tag HTML.',
  });

export const descriptionSchema = validate
  .string()
  .pattern(/^[^<>]*$/)
  .messages({
    'string.empty': 'Deskripsi tidak boleh kosong.',
    'string.pattern.base':
      'Deskripsi tidak boleh mengandung skrip atau tag HTML.',
  });

export const objectId = () =>
  validate.string().hex().length(24).messages({
    'string.base': 'ID harus berupa teks.',
    'string.hex': 'Format ID tidak valid.',
    'string.length': 'Panjang ID harus 24 karakter heksadesimal.',
  });

export const galleryPhotoSchema = validate.object({
  url: validate.string().uri().required().messages({
    'string.uri': 'URL foto galeri tidak valid.',
    'any.required': 'URL foto galeri wajib diisi.',
  }),
  caption: validate
    .string()
    .trim()
    .pattern(/^[^<>]*$/)
    .messages({
      'string.pattern.base':
        'Keterangan foto tidak boleh mengandung skrip atau tag HTML.',
    }),
  altText: validate
    .string()
    .trim()
    .pattern(/^[^<>]*$/)
    .messages({
      'string.pattern.base':
        'Teks alternatif tidak boleh mengandung skrip atau tag HTML.',
    }),
});

export const openingHourSchema = validate.object({
  day: validate
    .string()
    .valid(
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday'
    )
    .required()
    .messages({
      'any.only':
        'Hari harus salah satu dari: monday, tuesday, wednesday, thursday, friday, saturday, sunday.',
      'any.required': 'Hari wajib diisi.',
    }),
  hours: validate.string().default('Tutup'),
  isClosed: validate.boolean().default(false),
});

export const facilitySchema = validate.object({
  name: validate
    .string()
    .trim()
    .required()
    .pattern(/^[^<>]*$/)
    .messages({
      'string.empty': 'Nama fasilitas tidak boleh kosong.',
      'any.required': 'Nama fasilitas wajib diisi.',
      'string.pattern.base':
        'Nama fasilitas tidak boleh mengandung skrip atau tag HTML.',
    }),
  availability: validate.boolean().default(false),
  number: validate.number().integer().min(0).default(0).messages({
    'number.base': 'Jumlah fasilitas harus berupa angka.',
    'number.integer': 'Jumlah fasilitas harus berupa bilangan bulat.',
    'number.min': 'Jumlah fasilitas tidak boleh kurang dari 0.',
  }),
  disabilityAccess: validate.boolean().default(false),
  photo: validate.array().items(
    validate.string().uri().messages({
      'string.uri': 'URL foto fasilitas tidak valid.',
    })
  ),
});

export const contactSchema = validate.object({
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
      'lainnya'
    )
    .required()
    .messages({
      'any.only': 'Platform kontak tidak valid.',
      'any.required': 'Platform kontak wajib diisi.',
    }),
  value: validate
    .string()
    .trim()
    .required()
    .pattern(/^[^<>]*$/)
    .messages({
      'string.empty': 'Nilai kontak tidak boleh kosong.',
      'any.required': 'Nilai kontak wajib diisi.',
      'string.pattern.base':
        'Nilai kontak tidak boleh mengandung skrip atau tag HTML.',
    }),
});

export const ticketSchema = validate.object({
  adult: validate.number().min(0).required().default(0).messages({
    'number.base': 'Harga tiket dewasa harus berupa angka.',
    'number.min': 'Harga tiket dewasa tidak boleh kurang dari 0.',
    'any.required': 'Harga tiket dewasa wajib diisi.',
  }),
  child: validate.number().min(0).required().default(0).messages({
    'number.base': 'Harga tiket anak-anak harus berupa angka.',
    'number.min': 'Harga tiket anak-anak tidak boleh kurang dari 0.',
    'any.required': 'Harga tiket anak-anak wajib diisi.',
  }),
  disability: validate.number().min(0).required().default(0).messages({
    'number.base': 'Harga tiket disabilitas harus berupa angka.',
    'number.min': 'Harga tiket disabilitas tidak boleh kurang dari 0.',
    'any.required': 'Harga tiket disabilitas wajib diisi.',
  }),
});

export const parkingSchema = validate.object({
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
});

export const locationsSchema = validate.object({
  adresses: validate
    .string()
    .required()
    .pattern(/^[^<>]*$/)
    .messages({
      'string.empty': 'Alamat tidak boleh kosong.',
      'any.required': 'Alamat wajib diisi.',
      'string.pattern.base':
        'Alamat tidak boleh mengandung skrip atau tag HTML.',
    }),
  subdistrict: objectId().required().messages({
    'any.required': 'Kecamatan wajib diisi.',
  }),
  coordinates: validate.object({
    lat: validate.number(),
    long: validate.number(),
  }),
});
