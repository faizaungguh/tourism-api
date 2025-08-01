import { ResponseError } from '#errors/responseError.mjs';
import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';

const attractionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    photo: [
      {
        url: { type: String },
        caption: { type: String, trim: true },
      },
    ],
    ticketType: { type: String, required: true, enum: ['gratis', 'berbayar'] },
    ticket: {
      adult: { type: Number, default: 0 },
      child: { type: Number, default: 0 },
      disability: { type: Number, default: 0 },
    },
    destination: {
      type: Schema.Types.ObjectId,
      ref: 'Destination',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v, delete ret._id;
      },
    },
    toObject: { virtuals: true },
  }
);

attractionSchema.add({ slug: { type: String, lowercase: true } });

attractionSchema.index({ destination: 1, slug: 1 }, { unique: true });

attractionSchema.pre('save', async function (next) {
  if (this.isModified('ticketType') || this.isModified('ticket') || this.isNew) {
    if (this.ticketType === 'gratis') {
      this.ticket.adult = 0;
      this.ticket.child = 0;
      this.ticket.disability = 0;
    } else if (this.ticketType === 'berbayar') {
      if (this.ticket.adult == null || this.ticket.adult <= 0) {
        return next(
          new ResponseError(422, 'Tidak boleh kosong', {
            message:
              'Harga tiket dewasa wajib diisi dan harus lebih besar dari 0 untuk wahana berbayar.',
          })
        );
      }
    }
  }

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

export const Attraction = mongoose.model('Attraction', attractionSchema);
