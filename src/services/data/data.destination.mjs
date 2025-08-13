import path from 'path';
import fs from 'fs/promises';
import { checker } from '#validations/checker.mjs';
import { validations } from '#validations/validation.mjs';
import { helper } from '#helpers/index.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Admin } from '#schemas/admin.mjs';

export const destinationService = {
  post: async (adminId, request) => {
    const validatedRequest = validations.check.request(checker.destination.create, request);

    const savedDestination = await helper.Data.destination.create(adminId, validatedRequest);

    /** Ambil data yang baru disimpan dengan detail yang sudah di-populate */
    const pipeline = helper.Data.destination.get(savedDestination._id);
    const [result] = await Destination.aggregate(pipeline);
    return result;
  },

  list: async (query) => {
    /** Validasi dan ambil nilai default dari query */
    const validatedQuery = validations.check.request(checker.destination.list, query);

    /** Dapatkan aggregation pipeline dari helper */
    const pipeline = helper.Data.destination.list(validatedQuery);

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

  detail: async (destinationSlug) => {
    /** Validasi slug */
    if (!destinationSlug || typeof destinationSlug !== 'string' || destinationSlug.trim() === '') {
      throw new ResponseError(422, 'Proses dihentikan', {
        message: 'Slug destinasi harus berupa string yang tidak kosong.',
      });
    }

    const pipeline = helper.Data.destination.get(destinationSlug);
    const result = await Destination.aggregate(pipeline);
    if (!result || result.length === 0) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Destinasi dengan slug "${destinationSlug}" tidak ditemukan`,
      });
    }

    return result[0];
  },

  update: async (destinationSlug, adminId, request) => {
    if (!destinationSlug || typeof destinationSlug !== 'string' || destinationSlug.trim() === '') {
      throw new ResponseError(422, 'Proses dihentikan', {
        slug: `Destinasi yang anda masukkan ${destinationSlug}, tidak valid`,
      });
    }
    validations.check.isNotEmpty(request);

    const validatedRequest = validations.check.request(checker.destination.update, request);

    const updatedDestination = await helper.Data.destination.update(
      destinationSlug,
      adminId,
      validatedRequest,
    );

    const pipeline = helper.Data.destination.get(updatedDestination._id);
    const [result] = await Destination.aggregate(pipeline);

    return result;
  },

  drop: async (destinationSlug, adminId) => {
    if (!destinationSlug || typeof destinationSlug !== 'string' || destinationSlug.trim() === '') {
      throw new ResponseError(422, 'Proses dihentikan', { message: 'Destination tidak valid.' });
    }

    const [admin, destinationToDelete] = await Promise.all([
      Admin.findOne({ adminId }).select('_id').lean(),

      Destination.findOne({ slug: destinationSlug })
        .populate({ path: 'locations.subdistrict', select: 'abbrevation' })
        .select('_id createdBy destinationTitle slug locations'),
    ]);

    if (!admin) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Admin dengan ID "${adminId}" tidak ditemukan.`,
      });
    }
    if (!destinationToDelete) {
      throw new ResponseError(404, 'Data tidak ditemukan', {
        message: `Destinasi dengan slug "${destinationSlug}" tidak ditemukan.`,
      });
    }
    if (destinationToDelete.createdBy.toString() !== admin._id.toString()) {
      throw new ResponseError(403, 'Akses ditolak', {
        message: 'Anda tidak memiliki izin untuk menghapus destinasi ini.',
      });
    }

    const subdistrictSlug = destinationToDelete.locations.subdistrict.abbrevation;
    const dynamicDir = `destinations/${subdistrictSlug}_${destinationToDelete.slug}`;
    const destinationPath = path.join(process.cwd(), 'public', 'images', dynamicDir);

    try {
      await fs.rm(destinationPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Gagal menghapus folder destinasi ${destinationPath}:`, err);
    }

    await destinationToDelete.deleteOne();

    return {
      message: `Destinasi '${destinationToDelete.destinationTitle}', semua wahananya, dan semua file terkait berhasil dihapus.`,
    };
  },
};
