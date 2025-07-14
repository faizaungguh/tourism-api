import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const Schema = mongoose.Schema;

export const attractionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    photo: [
      {
        url: { type: String },
        caption: { type: String, trim: true },
        altText: { type: String, trim: true },
      },
    ],
    ticketType: { type: String, required: true, enum: ['gratis', 'berbayar'] },
    ticket: {
      adult: { type: Number },
      child: { type: Number },
      disability: { type: Number },
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

attractionSchema.add({ slug: { type: String, lowercase: true } });

attractionSchema.index({ destination: 1, slug: 1 }, { unique: true });

attractionSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    const existing = await this.constructor.findOne({
      slug: baseSlug,
      destination: this.destination,
    });
    this.slug = existing ? `${baseSlug}-${nanoid(5)}` : baseSlug;
  }
  next();
});
