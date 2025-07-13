import validate from 'joi';
import * as field from '#validations/fieldDestination.mjs';

export const destinationValidation = validate.object({
  destinationTitle: field.destinationTitleSchema.required().messages({
    'any.required': 'Judul destinasi wajib diisi.',
  }),
  categories: field.objectId().required().messages({
    'any.required': 'Kategori wajib diisi.',
  }),
  description: field.descriptionSchema.required().messages({
    'any.required': 'Deskripsi wajib diisi.',
  }),
  // profilePhoto: validate.string().uri().allow('').messages({
  //   'string.uri': 'URL foto profil tidak valid.',
  // }),
  // headlinePhoto: validate.string().uri().allow('').messages({
  //   'string.uri': 'URL foto headline tidak valid.',
  // }),
  // galleryPhoto: validate.array().items(field.galleryPhotoSchema),
  locations: field.locationsSchema.required(),
  openingHour: validate.array().items(field.openingHourSchema),
  facility: validate.array().items(field.facilitySchema),
  contact: validate.array().items(field.contactSchema),
  ticket: field.ticketSchema.required(),
  parking: field.parkingSchema,
});

export const patchDestinationValidation = validate.object({
  destinationTitle: field.destinationTitleSchema,
  categories: field.objectId(),
  description: field.descriptionSchema,
  // profilePhoto: validate.string().uri().allow('').messages({
  //   'string.uri': 'URL foto profil tidak valid.',
  // }),
  // headlinePhoto: validate.string().uri().allow('').messages({
  //   'string.uri': 'URL foto headline tidak valid.',
  // }),
  // galleryPhoto: validate.array().items(field.galleryPhotoSchema),
  locations: field.locationsSchema,
  openingHour: validate.array().items(field.openingHourSchema),
  facility: validate.array().items(field.facilitySchema),
  contact: validate.array().items(field.contactSchema),
  ticket: field.ticketSchema,
  parking: field.parkingSchema,
});
