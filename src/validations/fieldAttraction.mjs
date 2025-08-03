import validate from 'joi';

export const name = validate
  .string()
  .trim()
  .pattern(/^[^<>]*$/)
  .messages({
    'string.pattern.base': 'Wahana Wisata tidak mengandung skrip atau tag HTML',
  });

export const description = validate
  .string()
  .pattern(/^[^<>]*$/)
  .messages({
    'string.empty': 'Deskripsi tidak boleh kosong.',
    'string.pattern.base': 'Deskripsi tidak boleh mengandung skrip atau tag HTML.',
  });

export const ticketType = validate.string().valid('gratis', 'berbayar').messages({
  'any.only': 'harus menyertakan tipe tiket antara berbayar atau gratis',
  'any.required': 'tipe tiket wajib diisi',
});

export const ticket = validate.object({
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

export const patchTicket = validate.object({
  adult: validate.number().min(0),
  child: validate.number().min(0),
  disability: validate.number().min(0),
});

export const destination = validate.string();
