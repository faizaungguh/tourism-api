import { admin } from '#controllers/media/admin.mjs';
import { destination } from '#controllers/media/destination.mjs';
import { facility } from '#controllers/media/facility.mjs';
import { attraction } from '#controllers/media/attraction.mjs';

export const media = {
  profileAdmin: admin.profileMedia,

  /** Destinasi Media */
  destinationMedia: destination.photoMedia,

  addDestinationGallery: destination.addGallery,
  updateDestinationGallery: destination.patchGallery,
  deleteDestinationGallery: destination.dropGallery,

  addDestinationFacility: facility.addGallery,
  updateDestinationFacility: facility.patchGallery,
  deleteDestinationFacility: facility.dropGallery,

  /** Wahana Media */
  addAttractionGallery: attraction.addGallery,
  updateAttractionGallery: attraction.patchGallery,
  deleteAttractionGallery: attraction.dropGallery,
};
