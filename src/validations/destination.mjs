import validate from 'joi';
import * as field from '#validations/fieldDestination.mjs';

export const destinationValidation = validate.object({
  adminId: field.adminId.required(),
  destinationTitle: field.destinationTitle.required(),
  categories: field.categories.required(),
  description: field.description.required(),
  locations: field.locations.required(),
  openingHour: field.openingHour,
  facility: field.facility,
  contact: field.contact,
  ticket: field.ticket.required(),
  parking: field.parking,
});

export const patchDestinationValidation = validate
  .object({
    destinationTitle: field.destinationTitle,
    categories: field.categories,
    description: field.description,
    locations: field.locations,
    openingHour: field.openingHour,
    facility: field.facility,
    contact: field.contact,
    ticket: field.ticket,
    parking: field.parking,
  })
  .min(1)
  .messages({
    'object.min': 'Setidaknya satu field harus diisi untuk update.',
  });

export const listDestinationValidation = validate.object({
  page: validate.number().min(1).positive().default(1),
  size: validate.number().min(1).max(100).positive().default(10),
  sort: validate.string().valid('asc', 'desc').default('desc'),
  sortBy: validate
    .string()
    .valid('destinationTitle', 'category', 'subdistrict')
    .optional(),
  search: validate.string().optional().allow(''),
  category: validate.string().optional(),
  subdistrict: validate.string().optional(),
});
