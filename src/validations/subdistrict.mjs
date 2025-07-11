import validate from 'joi';

export const subdistrictValidation = validate.object({
  name: validate
    .string()
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.base': 'Kecamatan harus berupa teks',
      'string.empty': 'Kecamatan tidak boleh kosong',
      'string.pattern.base': 'Kecamatan hanya boleh berisi huruf dan spasi.',
      'any.required': 'Kecamatan wajib diisi',
    }),
});

export const listSubdistrictValidation = validate.object({
  page: validate.number().min(1).positive().default(1),
  size: validate.number().min(1).max(20).positive().default(5),
  sort: validate.string().valid('asc', 'desc').default('asc'),
});
