import mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const SubdistrictSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String },
    slug: { type: String },
  },
  { timestamps: true }
);

SubdistrictSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  next();
});
