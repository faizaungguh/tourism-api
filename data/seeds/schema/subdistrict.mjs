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
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  next();
});

export const Subdistrict = mongoose.model('Subdistrict', subdistrictSchema);
