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
    page: field.page,
    size: field.size,
    sort: field.sort,
    sortBy: field.sortBy,
    search: field.search,
    category: field.category,
    subdistrict: field.subdistrict,
  }),

  getRaw: field.getRaw,
};
