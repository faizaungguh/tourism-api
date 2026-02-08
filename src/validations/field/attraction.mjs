import validate from 'joi';
import { validations } from '#validations/index.mjs';

const ticketSchema = validate.object({
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
});

export const field = {
  name: validate.string().trim().custom(validations.sanitizer.string).messages({
    'string.pattern.base': 'Wahana Wisata tidak mengandung skrip atau tag HTML',
  }),

  description: validate.string().custom(validations.sanitizer.string).messages({
    'string.empty': 'Deskripsi tidak boleh kosong.',
    'string.pattern.base': 'Deskripsi tidak boleh mengandung skrip atau tag HTML.',
  }),

  ticketType: validate.string().valid('gratis', 'berbayar').messages({
    'any.only': 'harus menyertakan tipe tiket antara berbayar atau gratis',
    'any.required': 'tipe tiket wajib diisi',
  }),

  conditionalTicket: validate.when('ticketType', {
    is: 'berbayar',
    then: ticketSchema.required().messages({
      'any.required': 'Detail harga tiket wajib diisi jika tipe tiket adalah berbayar.',
    }),
    otherwise: validate.forbidden(),
  }),

  patchTicket: ticketSchema,

  destination: validate.string(),
};
