import mongoose from 'mongoose';
import { ResponseError } from '#errors/responseError.mjs';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
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

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

categorySchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const existingCategory = await this.constructor.findOne({
      name: this.name,
    });
    if (existingCategory && existingCategory._id.toString() !== this._id.toString()) {
      return next(
        new ResponseError(409, 'Duplikasi data', {
          message: `Kategori dengan nama '${this.name}' sudah ada.`,
        })
      );
    }
  }

  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
  next();
});

categorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  const newName = update.$set?.name;

  if (newName) {
    const filter = this.getFilter();
    const existingCategory = await this.model.findOne({
      name: newName,
      _id: { $ne: filter._id },
    });
    if (existingCategory) {
      return next(
        new ResponseError(409, 'Duplikasi data', {
          message: `Kategori dengan nama '${newName}' sudah ada.`,
        })
      );
    }
    update.$set.slug = generateSlug(newName);
  }
  next();
});

categorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const Destination = mongoose.model('Destination');
  const destinationCount = await Destination.countDocuments({
    category: this._id,
  });

  if (destinationCount > 0) {
    const error = new ResponseError(
      409,
      `Kategori tidak dapat dihapus karena masih digunakan oleh ${destinationCount} destinasi.`
    );
    return next(error);
  }

  next();
});

export const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
