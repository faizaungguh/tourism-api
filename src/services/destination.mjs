import * as checker from '#validations/destination.mjs';
import * as validate from '#validations/validate.mjs';
import * as helper from '#helpers/destinationHelper.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import { Admin } from '#schemas/admin.mjs';

export const destinationService = {
  create: async (adminId, request) => {
    const validatedRequest = validate.requestCheck(checker.destinationValidation, request);

    const savedDestination = await helper.createDestination(adminId, validatedRequest);

    /** Ambil data yang baru disimpan dengan detail yang sudah di-populate */
    const pipeline = helper.getDestination(savedDestination._id);
    const [result] = await Destination.aggregate(pipeline);
    return result;
  },

  getAll: async (query) => {
    /** Validasi dan ambil nilai default dari query */
    const validatedQuery = validate.requestCheck(checker.listDestinationValidation, query);

    /** Dapatkan aggregation pipeline dari helper */
    const pipeline = helper.listDestination(validatedQuery);

    const result = await Destination.aggregate(pipeline);

    const data = result[0].data;
    const totalItems = result[0].metadata[0] ? result[0].metadata[0].totalItems : 0;

    const { page, size } = validatedQuery;

    return {
      result: data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / size),
        totalItems,
        size,
      },
    };
  },

  getDetailDestination: async (destinationSlug) => {
    /** Validasi slug */
    if (!destinationSlug || typeof destinationSlug !== 'string' || destinationSlug.trim() === '') {
      throw new ResponseError(400, 'Destination slug tidak valid.', {
        message: 'Slug destinasi harus berupa string yang tidak kosong.',
      });
    }

    const pipeline = helper.getDestination(destinationSlug);
    const result = await Destination.aggregate(pipeline);

    if (!result || result.length === 0) {
      throw new ResponseError(404, 'Destinasi tidak ditemukan.', {
        message: `Destinasi dengan slug "${destinationSlug}" tidak ditemukan`,
      });
    }

    return result[0];
  },

  update: async (destinationSlug, adminId, request) => {
    if (!destinationSlug || typeof destinationSlug !== 'string' || destinationSlug.trim() === '') {
      throw new ResponseError(400, 'Destination slug tidak valid.', {
        slug: `Destinasi yang anda masukkan ${destinationSlug}, tidak valid`,
      });
    }
    validate.isNotEmpty(request);

    const validatedRequest = validate.requestCheck(checker.patchDestinationValidation, request);

    const updatedDestination = await helper.patchDestination(
      destinationSlug,
      adminId,
      validatedRequest
    );

    const pipeline = helper.getDestination(updatedDestination._id);
    const [result] = await Destination.aggregate(pipeline);

    return result;
  },

  drop: async (destinationSlug, adminId) => {
    if (!destinationSlug || typeof destinationSlug !== 'string' || destinationSlug.trim() === '') {
      throw new ResponseError(400, 'Destination slug tidak valid.', {
        slug: `Destinasi yang anda masukkan ${destinationSlug}, tidak valid`,
      });
    }

    const [admin, destinationToDelete] = await Promise.all([
      Admin.findOne({ adminId }).select('_id').lean(),
      Destination.findOne({ slug: destinationSlug }).select(
        '_id createdBy destinationTitle attractions'
      ),
    ]);

    if (!admin) {
      throw new ResponseError(404, 'Admin tidak ditemukan.', {
        adminId: `Admin dengan ID "${adminId}" tidak ditemukan.`,
      });
    }

    if (!destinationToDelete) {
      throw new ResponseError(404, 'Data tidak ditemukan.', {
        message: `Destinasi dengan slug "${destinationSlug}" tidak ditemukan.`,
      });
    }

    if (destinationToDelete.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak.', {
        message: 'Anda tidak memiliki izin untuk menghapus destinasi ini.',
      });
    }

    await destinationToDelete.deleteOne();

    return {
      message: `Destinasi '${destinationToDelete.destinationTitle}' dan semua wahananya berhasil dihapus.`,
    };
  },
};
