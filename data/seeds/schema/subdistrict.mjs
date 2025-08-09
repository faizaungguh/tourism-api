import mongoose from 'mongoose';
import { ResponseError } from '#errors/responseError.mjs';

async function generateUniqueAbbreviation(name, model, currentDocId) {
  const words = name.trim().split(/\s+/);
  let baseAbbr = '';

  if (words.length === 1) {
    baseAbbr = words[0].substring(0, 4);
  } else if (words.length === 2) {
    baseAbbr = words[0].substring(0, 3) + words[1].substring(0, 1);
  } else {
    baseAbbr = words[0].substring(0, 2) + words[1].substring(0, 1) + words[2].substring(0, 1);
  }

  baseAbbr = baseAbbr.toUpperCase().padEnd(4, 'X');

  let finalAbbr = baseAbbr;
  let counter = 1;

  while (true) {
    const existingDoc = await model.findOne({ abbrevation: finalAbbr });
    if (!existingDoc || existingDoc._id.toString() === currentDocId.toString()) {
      break;
    }
    finalAbbr = baseAbbr.substring(0, 3) + counter;
    counter++;
  }

  return finalAbbr;
}

const subdistrictSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    abbrevation: { type: String, unique: true, uppercase: true, trim: true },
    slug: { type: String, unique: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v, delete ret._id;
      },
    },
  }
);

subdistrictSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    const existingSubdistrict = await this.constructor.findOne({ name: this.name });
    if (existingSubdistrict && existingSubdistrict._id.toString() !== this._id.toString()) {
      return next(
        new ResponseError(409, 'Duplikasi data.', {
          name: `Kecamatan dengan nama '${this.name}' sudah ada.`,
        })
      );
    }
  }

  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    this.abbrevation = await generateUniqueAbbreviation(this.name, this.constructor, this._id);
  }

  next();
});

subdistrictSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const Destination = mongoose.model('Destination');
  const destinationCount = await Destination.countDocuments({
    'locations.subdistrict': this._id,
  });

  if (destinationCount > 0) {
    const error = new ResponseError(409, 'Duplikasi data.', {
      message: `Kecamatan tidak dapat dihapus karena masih digunakan oleh ${destinationCount} destinasi.`,
    });
    return next(error);
  }

  next();
});

export const Subdistrict =
  mongoose.models.Subdistrict || mongoose.model('Subdistrict', subdistrictSchema);
