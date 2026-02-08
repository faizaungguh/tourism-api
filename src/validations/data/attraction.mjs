import validate from 'joi';
import { field } from '#validations/field/attraction.mjs';

export const attractionChecker = {
  create: validate
    .object({
      name: field.name.required(),
      description: field.description.required(),
      ticketType: field.ticketType.required(),
      ticket: field.conditionalTicket,
    })
    .messages({
      'object.unknown':
        'Input {#label} tidak diizinkan. Hanya name, description, ticketType, dan ticket yang diperbolehkan.',
    }),

  patch: validate
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
    }),
};
