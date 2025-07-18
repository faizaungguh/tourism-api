import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
  },
  { timestamps: true }
);

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

categorySchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = generateSlug(this.name);
  }
  next();
});

categorySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  // Jika nama diubah, perbarui juga slug-nya
  if (update.$set && update.$set.name) {
    update.$set.slug = generateSlug(update.$set.name);
  }
  next();
});

export const Category = mongoose.model('Category', categorySchema);
