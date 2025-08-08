import { ResponseError } from '#errors/responseError.mjs';
import mongoose, { Schema } from 'mongoose';
import { nanoid } from 'nanoid';
import { Destination } from '#schemas/destination.mjs';

const attractionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    photos: [
      {
        url: { type: String },
        photoId: { type: String, trim: true },
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
    if (this.ticket.adult > 0 || this.ticket.child > 0 || this.ticket.disability > 0) {
      this.ticketType = 'berbayar';
    }

    if (this.ticketType === 'gratis') {
      this.ticket.adult = 0;
      this.ticket.child = 0;
      this.ticket.disability = 0;
    } else if (
      this.ticketType === 'berbayar' &&
      (this.ticket.adult == null || this.ticket.adult <= 0)
    ) {
      return next(
        new ResponseError(422, 'Tidak boleh kosong', {
          message:
            'Harga tiket dewasa wajib diisi dan harus lebih besar dari 0 untuk wahana berbayar.',
        })
      );
    }
  }

  if (
    (this.isModified('photos') || this.isModified('name') || this.isNew) &&
    this.photos &&
    this.photos.length > 0
  ) {
    try {
      const destinationDoc = await Destination.findById(this.destination)
        .select('destinationTitle')
        .lean();

      if (destinationDoc) {
        const destinationTitle = destinationDoc.destinationTitle;
        const attractionName = this.name;
        this.photos.forEach((photo) => {
          photo.caption = `Foto Wahana ${attractionName} di ${destinationTitle}`;
        });
      }
    } catch (error) {
      return next(error);
    }
  }

  if (this.isModified('name') || this.isNew) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    let slug = baseSlug;
    let isUnique = false;
    while (!isUnique) {
      const query = { slug: slug, destination: this.destination };
      if (!this.isNew) {
        query._id = { $ne: this._id };
      }
      const existing = await this.constructor.findOne(query);
      if (!existing) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${nanoid(5)}`;
      }
    }
    this.slug = slug;
  }
  next();
});

attractionSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (update.$set && update.$set.name) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) {
      return next();
    }

    const baseSlug = update.$set.name
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    let slug = baseSlug;
    let isUnique = false;
    while (!isUnique) {
      const query = {
        slug: slug,
        destination: docToUpdate.destination,
        _id: { $ne: docToUpdate._id },
      };
      const existing = await this.model.findOne(query);
      if (!existing) {
        isUnique = true;
      } else {
        slug = `${baseSlug}-${nanoid(5)}`;
      }
    }
    update.$set.slug = slug;
  }

  next();
});

attractionSchema.pre('deleteOne', { document: true }, async function (next) {});

attractionSchema.pre('deleteMany', { document: true }, async function (next) {});

export const Attraction = mongoose.model('Attraction', attractionSchema);
