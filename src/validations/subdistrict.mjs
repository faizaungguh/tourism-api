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
