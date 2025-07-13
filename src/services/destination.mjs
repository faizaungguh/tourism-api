import mongoose from 'mongoose';
import * as checker from '#validations/destination.mjs';
import * as validate from '#validations/validate.mjs';
import { destinationSchema } from '#schemas/destination.mjs';
import { ResponseError } from '#errors/responseError.mjs';
import { categorySchema } from '#schemas/category.mjs';
import { SubdistrictSchema } from '#schemas/subdistrict.mjs';

const Destination = mongoose.model('Destination', destinationSchema);
const Category = mongoose.model('Category', categorySchema);
const Subdistrict = mongoose.model('Subdistrict', SubdistrictSchema);

export const createDestination = async (request) => {
  validate.isNotEmpty(request);

  /** validasi request */
  const validatedRequest = validate.requestCheck(
    checker.destinationValidation,
    request
  );

  /** Cek duplikasi judul dan validasi keberadaan Kategori & Kecamatan */
  const [existingDestination, categoryDoc, subdistrictDoc] = await Promise.all([
    Destination.findOne({
      destinationTitle: validatedRequest.destinationTitle,
    }).select('destinationTitle'),
    Category.findOne({
      name: validatedRequest.categories,
    }).select('_id'),
    Subdistrict.findOne({
      name: validatedRequest.locations.subdistrict,
    }).select('_id'),
  ]);

  /** munculkan pesan error jika ada duplikasi */
  if (existingDestination) {
    throw new ResponseError(409, 'Destinasi Wisata tidak tersedia.', {
      destinationTitle: 'Destinasi Wisata tersebut ini sudah digunakan.',
    });
  }

  if (!categoryDoc) {
    throw new ResponseError(404, 'Kategori tidak ditemukan.', {
      categories: `Kategori dengan nama "${validatedRequest.categories}" tidak ada.`,
    });
  }

  if (!subdistrictDoc) {
    throw new ResponseError(404, 'Kecamatan tidak ditemukan.', {
      subdistrict: `Kecamatan dengan nama "${validatedRequest.locations.subdistrict}" tidak ada.`,
    });
  }

  /** jika tidak ada duplikasi, simpan data */
  validatedRequest.categories = categoryDoc._id;
  validatedRequest.locations.subdistrict = subdistrictDoc._id;
  const newDestination = new Destination(validatedRequest);
  const savedDestination = await newDestination.save();

  /** kembalikan data yang sudah disimpan */
  return savedDestination;
};

export const getAllDestination = async (query) => {};

export const getDetailDestination = async (id) => {};

export const updateDestination = async (id, request) => {};

export const deleteDestination = async (id) => {};
