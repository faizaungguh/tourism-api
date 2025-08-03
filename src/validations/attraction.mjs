import validate from 'joi';
import * as field from '#validations/fieldAttraction.mjs';

export const createAttractionValidation = validate
  .object({
    name: field.name.required(),
    description: field.description.required(),
    ticketType: field.ticketType.required(),
    ticket: validate.when('ticketType', {
      is: 'berbayar',
      then: field.ticket.required().messages({
        'any.required': 'Detail harga tiket wajib diisi jika tipe tiket adalah berbayar.',
      }),
      otherwise: validate.forbidden(),
    }),
  })
  .messages({
    'object.unknown':
      'Input {#label} tidak diizinkan. Hanya name, description, ticketType, dan ticket yang diperbolehkan.',
  });

export const patchAttractionValidation = validate
  .object({
    name: field.name,
    description: field.description,
    ticketType: field.ticketType,
    ticket: field.patchTicket,
  })
  .min(1)
  .messages({
    'object.min': 'Setidaknya satu field harus diisi untuk melakukan update.',
    'object.unknown': 'Input {#label} tidak diizinkan.',
  });
