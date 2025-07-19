import * as validate from '#validations/validate.mjs';
import * as checker from '#validations/attraction.mjs';
import * as helper from '#helpers/attractionPipeline.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Admin } from '#schemas/admin.mjs';

export const attractionService = {
  create: async (adminId, slug, request) => {
    const [destination, admin] = await Promise.all([
      Destination.findOne({ slug: slug }).select('_id createdBy').lean(),
      Admin.findOne({ adminId: adminId }).select('_id').lean(),
    ]);

    if (!destination) {
      throw new ResponseError(404, 'Destinasi tidak ditemukan', {
        message: `Destinasi dengan slug '${slug}' tidak ditemukan.`,
      });
    }

    if (destination.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message:
          'Anda tidak memiliki izin untuk menambahkan wahana ke destinasi ini.',
      });
    }

    const validatedRequest = validate.requestCheck(
      checker.createAttractionValidation,
      request
    );

    const newAttraction = await helper.createAttraction(
      destination._id,
      validatedRequest
    );

    await Destination.findByIdAndUpdate(destination._id, {
      $push: { attractions: newAttraction._id },
    });

    const { name, description, ticketType, ticket } = newAttraction;
    return { name, description, ticketType, ticket };
  },

  update: async (adminId, destinationSlug, attractionSlug, request) => {
    validate.isNotEmpty(request);
    /** 1. Otorisasi: Pastikan admin adalah manajer dan pemilik destinasi */
    if (!adminId) {
      throw new ResponseError(403, 'Unauthorized', {
        message: 'Admin ID diperlukan untuk otorisasi.',
      });
    }

    const admin = await Admin.findOne({ adminId }).select('_id role').lean();

    if (!admin || admin.role !== 'manager') {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Hanya manajer yang dapat mengubah wahana wisata.',
      });
    }

    const destination = await Destination.findOne({ slug: destinationSlug })
      .select('_id createdBy')
      .lean();

    if (!destination) {
      throw new ResponseError(404, 'Destinasi tidak ditemukan', {
        message: `Destinasi dengan slug '${destinationSlug}' tidak ditemukan.`,
      });
    }

    if (destination.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message:
          'Anda tidak memiliki izin untuk mengubah wahana di destinasi ini.',
      });
    }

    /** 2. Cari wahana yang akan diupdate */
    const attractionToUpdate = await Attraction.findOne({
      slug: attractionSlug,
      destination: destination._id,
    });

    if (!attractionToUpdate) {
      throw new ResponseError(404, 'Wahana tidak ditemukan', {
        message: `Wahana dengan slug '${attractionSlug}' tidak ditemukan di destinasi ini.`,
      });
    }

    /** 3. Validasi request body */
    const validatedRequest = validate.requestCheck(
      checker.patchAttractionValidation,
      request
    );

    /** 4. Cek duplikasi nama jika nama diubah */
    if (
      validatedRequest.name &&
      validatedRequest.name !== attractionToUpdate.name
    ) {
      const existingAttraction = await Attraction.findOne({
        name: validatedRequest.name,
        destination: destination._id,
      }).select('name');

      if (existingAttraction) {
        throw new ResponseError(
          409,
          'Nama wahana sudah ada di destinasi ini.',
          {
            name: `Wahana dengan nama '${validatedRequest.name}' sudah terdaftar.`,
          }
        );
      }
    }

    /** 5. Lakukan pembaruan dan kembalikan data baru */
    Object.assign(attractionToUpdate, validatedRequest);
    const updatedAttraction = await attractionToUpdate.save();

    const { name, slug, description, ticketType, ticket } = updatedAttraction;

    return {
      name,
      slug,
      description,
      ticketType,
      ticket,
    };
  },

  drop: async (adminId, destinationSlug, attractionSlug) => {
    /** 1. Otorisasi: Pastikan admin adalah manajer dan pemilik destinasi */
    if (!adminId) {
      throw new ResponseError(401, 'Unauthorized', {
        message: 'Admin ID diperlukan untuk otorisasi.',
      });
    }

    const admin = await Admin.findOne({ adminId }).select('_id role').lean();

    if (!admin || admin.role !== 'manager') {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Hanya manajer yang dapat menghapus wahana wisata.',
      });
    }

    const destination = await Destination.findOne({ slug: destinationSlug })
      .select('_id createdBy')
      .lean();

    if (!destination) {
      throw new ResponseError(404, 'Destinasi tidak ditemukan', {
        message: `Destinasi dengan slug '${destinationSlug}' tidak ditemukan.`,
      });
    }

    if (destination.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message:
          'Anda tidak memiliki izin untuk menghapus wahana di destinasi ini.',
      });
    }

    /** 2. Cari dan hapus wahana */
    const attractionToDelete = await Attraction.findOneAndDelete({
      slug: attractionSlug,
      destination: destination._id,
    });

    if (!attractionToDelete) {
      throw new ResponseError(404, 'Wahana tidak ditemukan', {
        message: `Wahana dengan slug '${attractionSlug}' tidak ditemukan di destinasi ini.`,
      });
    }

    /** 3. Hapus referensi dari dokumen destinasi */
    await Destination.updateOne(
      { _id: destination._id },
      { $pull: { attractions: attractionToDelete._id } }
    );

    return attractionToDelete.toObject();
  },
};
