import validate from 'joi';
import * as field from '#validations/fieldDestination.mjs';

export const destinationValidation = validate.object({
  destinationTitle: field.destinationTitle.required(),
  categories: field.categories.required(),
  createdBy: field.objectId().required(),
  description: field.description.required(),
  locations: field.locations.required(),
  openingHour: field.openingHour,
  facility: field.facility,
  contact: field.contact,
  ticket: field.ticket.required(),
  parking: field.parking,
});
