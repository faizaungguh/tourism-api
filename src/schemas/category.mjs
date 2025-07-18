import mongoose from 'mongoose';

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
};

const Schema = mongoose.Schema;
export const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
  },
  { timestamps: true }
);

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
