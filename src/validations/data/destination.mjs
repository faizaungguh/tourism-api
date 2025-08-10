import validate from 'joi';
import { field } from '#validations/field/destination.mjs';

export const destinationChecker = {
  valid: validate
    .object({
      destinationTitle: field.destinationTitle.required(),
      categories: field.categories.required(),
      description: field.description.required(),
      locations: field.locations,
      openingHour: field.openingHour.required(),
      facility: field.facility,
      contact: field.contact.required(),
      ticket: field.ticket.required(),
      parking: field.parking.required(),
    })
    .messages({
      'object.unknown':
        'Input {#label} tidak diizinkan. destinationTitle categories,description, locations, openingHour, facility, contact, ticket,dang parking yang diperbolehkan.',
    }),

  patch: validate
    .object({
      destinationTitle: field.destinationTitle,
      categories: field.categories,
      description: field.description,
      locations: field.locations,
      openingHour: field.openingHour,
      facility: field.facility,
      contact: field.contact,
      ticket: field.patchTicket,
      parking: field.parking,
    })
    .min(1)
    .messages({
      'object.min': 'Setidaknya satu field harus diisi untuk update.',
      'object.unknown':
        'Input {#label} tidak diizinkan. destinationTitle categories,description, locations, openingHour, facility, contact, ticket,dang parking yang diperbolehkan.',
    }),

  list: validate.object({
    page: validate.number().min(1).positive().default(1),
    size: validate.number().min(1).max(100).positive().default(10),
    sort: validate.string().valid('asc', 'desc').default('desc'),
    sortBy: validate.string().valid('destinationTitle', 'category', 'subdistrict').optional(),
    search: validate.string().optional().allow(''),
    category: validate.string().optional(),
    subdistrict: validate.string().optional(),
  }),

  getRaw: validate.object({
    limit: validate.number().integer().min(1).optional(),
  }),
};
