import mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const SubdistrictSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    slug: { type: String, unique: true },
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

  if (this.isNew) {
    try {
      const prefix = '33.02.';

      const lastDoc = await this.constructor
        .findOne({ code: { $regex: `^${prefix}` } })
        .sort({ code: -1 });

      let sequence = 1;
      if (lastDoc && lastDoc.code) {
        const lastCodeParts = lastDoc.code.split('.');
        const lastSequence = parseInt(
          lastCodeParts[lastCodeParts.length - 1],
          10
        );
        sequence = lastSequence + 1;
      }

      const formattedSequence = String(sequence).padStart(2, '0');
      this.code = `${prefix}${formattedSequence}`;
    } catch (error) {
      return next(error);
    }
  }

  next();
});
