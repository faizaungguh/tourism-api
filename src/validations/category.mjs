import validate from 'joi';

export const categoryValidation = validate.object({
  name: validate
    .string()
    .required()
    .pattern(/^[^<>]*$/)
    .messages({
      'string.base': 'Kategori harus berupa teks',
      'string.empty': 'Kategori tidak boleh kosong',
      'string.pattern.base':
        'Nama kategori tidak boleh mengandung skrip atau tag HTML.',
      'any.required': 'Kategori wajib diisi',
    }),
});
