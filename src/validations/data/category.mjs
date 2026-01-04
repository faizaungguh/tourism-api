import validate from 'joi';
import { validations } from '#validations/index.mjs';

export const categoryChecker = {
  valid: validate.object({
    name: validate.string().required().custom(validations.sanitizer.string).messages({
      'string.base': 'Kategori harus berupa teks',
      'string.empty': 'Kategori tidak boleh kosong',
      'string.pattern.base': 'Nama kategori tidak boleh mengandung skrip atau tag HTML.',
      'any.required': 'Kategori wajib diisi',
    }),
  }),

  list: validate.object({
    page: validate.number().min(1).positive().default(1),
    size: validate.number().min(1).max(20).positive().default(5),
    sort: validate.string().valid('asc', 'desc').default('asc'),
  }),
};
