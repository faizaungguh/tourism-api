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

export const listCategoryValidation = validate.object({
  page: validate.number().min(1).positive().default(1),
  size: validate.number().min(1).max(20).positive().default(5),
  sort: validate.string().valid('asc', 'desc').default('asc'),
});
