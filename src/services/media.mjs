import { admin } from '#services/media/admin.mjs';
import { destinationService as destination } from '#services/media/destination.mjs';
import { facility } from '#services/media/facility.mjs';
import { attraction } from '#services/media/attraction.mjs';

export const mediaService = {
  updateAdminPhoto: admin.profilePhoto,

  updateDestinationMedia: destination.photoMedia,
  addDestinationGallery: destination.addGallery,
  updateDestinationGallery: destination.patchGallery,
  deleteDestinationGallery: destination.dropGallery,

  addDestinationFacility: facility.addGallery,
  updateDestinationFacility: facility.patchGallery,
  deleteDestinationFacility: facility.dropGallery,

  /** Wahana Media */
  addAttractionGallery: attraction.addGallery,
  addAttractionGallery: attraction.patchGallery,
  deleteAttractionGallery: attraction.dropGallery,
};
