import path from 'path';
import fs from 'fs/promises';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';

export const facilityService = {
  add: async (req) => {
    const { foundDestination, foundFacility, processedFacilityPhotos } = req;

    const result = await Destination.updateOne(
      {
        _id: foundDestination._id,
        'facility.slug': foundFacility.slug,
      },
      {
        $push: {
          'facility.$.photo': { $each: processedFacilityPhotos },
        },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(500, 'Gagal menyimpan foto fasilitas ke database.');
    }

    return processedFacilityPhotos;
  },

  list: async (foundFacility) => {
    return foundFacility.photo || [];
  },

  update: async () => {},

  dropAll: async (destinationDoc, facilityDoc) => {
    if (!destinationDoc || !facilityDoc) {
      throw new ResponseError(422, 'Dokumen destinasi atau fasilitas tidak ditemukan.');
    }

    if (!facilityDoc.photo || facilityDoc.photo.length === 0) {
      return;
    }

    const destinationSlug = destinationDoc.slug;
    const subdistrictSlug = destinationDoc.locations.subdistrict.abbrevation;
    const facilitySlug = facilityDoc.slug;

    const dynamicDir = `destinations/${subdistrictSlug}_${destinationSlug}/facility/${facilitySlug}`;
    const facilitySpecificPath = path.join(process.cwd(), 'public', 'images', dynamicDir);

    try {
      toilet - umum / (await fs.rm(facilitySpecificPath, { recursive: true, force: true }));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(
          `Gagal menghapus direktori fasilitas, namun proses DB tetap dilanjutkan: ${facilitySpecificPath}`,
          err
        );
      }
    }

    const result = await Destination.updateOne(
      {
        _id: destinationDoc._id,
        'facility.slug': facilityDoc.slug,
      },
      {
        $set: { 'facility.$.photo': [] },
      }
    );

    if (result.modifiedCount === 0) {
      throw new ResponseError(500, 'Gagal mengosongkan data foto fasilitas di database.');
    }
  },

  dropOne: async () => {},
};
