import { ResponseError } from '#errors/responseError.mjs';
import path from 'path';
import fs from 'fs/promises';
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
        new ResponseError(422, 'Proses dihentikan', {
          message:
            'Harga tiket dewasa wajib diisi dan harus lebih besar dari 0 untuk wahana berbayar.',
        })
      );
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

attractionSchema.pre('findOneAndDelete', async function (next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());

    if (docToDelete) {
      const destinationDoc = await Destination.findById(docToDelete.destination)
        .populate({
          path: 'locations.subdistrict',
          select: 'abbrevation',
        })
        .select('slug locations')
        .lean();

      if (destinationDoc && docToDelete.photos && docToDelete.photos.length > 0) {
        const attractionDir = path.join(
          process.cwd(),
          'public',
          'images',
          `destinations/${destinationDoc.locations.subdistrict.abbrevation}_${destinationDoc.slug}/attraction/${docToDelete.slug}`
        );
        await fs.rm(attractionDir, { recursive: true, force: true });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});
attractionSchema.pre('deleteMany', { document: true }, async function (next) {
  try {
    const docToDelete = await this.model.findOne(this.getQuery());

    if (docToDelete) {
      const destinationDoc = await Destination.findById(docToDelete.destination)
        .populate({
          path: 'locations.subdistrict',
          select: 'abbrevation',
        })
        .select('slug locations')
        .lean();

      if (destinationDoc && docToDelete.photos && docToDelete.photos.length > 0) {
        const attractionDir = path.join(
          process.cwd(),
          'public',
          'images',
          `destinations/${destinationDoc.locations.subdistrict.abbrevation}_${destinationDoc.slug}/attraction/`
        );
        await fs.rm(attractionDir, { recursive: true, force: true });
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

export const Attraction =
  mongoose.models.Attraction || mongoose.model('Attraction', attractionSchema);
