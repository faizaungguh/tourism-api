import mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
  },
  { timestamps: true }
);

categorySchema.pre('save', async function (next) {
  if (this.isNew) {
    const prefix = 'cat';

    const lastDoc = await this.constructor.findOne().sort({ createdAt: -1 });

    let sequence = 1;
    if (lastDoc && lastDoc.code) {
      const lastSequence = parseInt(lastDoc.code.split('-')[1], 10);
      sequence = lastSequence + 1;
    }

    this.code = `${prefix}-${String(sequence).padStart(3, '0')}`;
  }

  next();
});
