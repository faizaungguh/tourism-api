import mongoose from 'mongoose';

const subdistrictSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

subdistrictSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const existingSubdistrict = await this.constructor.findOne({
      name: this.name,
    });
    if (
      existingSubdistrict &&
      existingSubdistrict._id.toString() !== this._id.toString()
    ) {
      return next(
        new ResponseError(
          409,
          `Kecamatan dengan nama '${this.name}' sudah ada.`
        )
      );
    }
  }

  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  next();
});

subdistrictSchema.pre(
  'deleteOne',
  { document: true, query: false },
  async function (next) {
    const Destination = mongoose.model('Destination');
    const destinationCount = await Destination.countDocuments({
      'locations.subdistrict': this._id,
    });

    if (destinationCount > 0) {
      const error = new ResponseError(
        409,
        `Kecamatan tidak dapat dihapus karena masih digunakan oleh ${destinationCount} destinasi.`
      );
      return next(error);
    }

    next();
  }
);

export const Subdistrict = mongoose.model('Subdistrict', subdistrictSchema);
