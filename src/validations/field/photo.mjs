import validate from 'joi';

/** upload foto admin collection */
export const profilePhoto = validate.string().uri().messages({
  'string.uri': 'URL foto profil tidak valid.',
});

export const headlinePhoto = validate.string().uri().messages({
  'string.uri': 'URL foto utama tidak valid.',
});

export const galleryPhoto = validate.array().items(
  validate.object({
    url: validate.string().uri().required().messages({
      'string.uri': 'URL foto galeri tidak valid.',
      'any.required': 'URL foto galeri wajib diisi.',
    }),
    caption: validate
      .string()
      .trim()
      .pattern(/^[^<>]*$/)
      .messages({
        'string.pattern.base': 'Keterangan foto tidak boleh mengandung skrip atau tag HTML.',
      }),
    altText: validate
      .string()
      .trim()
      .pattern(/^[^<>]*$/)
      .messages({
        'string.pattern.base': 'Teks alternatif foto tidak boleh mengandung skrip atau tag HTML.',
      }),
  })
);
