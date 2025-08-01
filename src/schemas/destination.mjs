import mongoose, { Schema } from 'mongoose';
import { customAlphabet } from 'nanoid';
import { Subdistrict } from './subdistrict.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const destinationSchema = new Schema(
  {
    destinationsId: { type: String, unique: true },
    destinationTitle: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    description: { type: String },
    profilePhoto: { type: String },
    headlinePhoto: { type: String },
    galleryPhoto: [
      {
        url: { type: String },
        caption: { type: String, trim: true },
      },
    ],
    locations: {
      addresses: { type: String },
      subdistrict: {
        type: Schema.Types.ObjectId,
        ref: 'Subdistrict',
        required: true,
      },
      coordinates: { lat: { type: Number }, long: { type: Number } },
    },
    openingHour: [
      {
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
        hours: { type: String, default: 'Tutup' },
        isClosed: { type: Boolean, default: false },
        _id: false,
      },
    ],
    attractions: [{ type: Schema.Types.ObjectId, ref: 'Attraction' }],
    facility: [
      {
        name: { type: String, trim: true, required: true },
        availability: { type: Boolean, default: false },
        number: { type: Number, default: 0 },
        disabilityAccess: { type: Boolean, default: false },
        photo: [
          {
            url: { type: String },
            caption: { type: String, trim: true },
          },
        ],
      },
    ],
    contact: [
      {
        platform: {
          type: String,
          enum: [
            'phone',
            'whatsapp',
            'email',
            'website',
            'instagram',
            'facebook',
            'twitter',
            'tiktok',
          ],
        },
        value: { type: String, trim: true },
      },
    ],
    ticket: {
      adult: { type: Number },
      child: { type: Number },
      disability: { type: Number },
    },
    slug: { type: String, lowercase: true, unique: true },
    parking: {
      motorcycle: { capacity: { type: Number }, price: { type: Number } },
      car: { capacity: { type: Number }, price: { type: Number } },
      bus: { capacity: { type: Number }, price: { type: Number } },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v, delete ret._id;
      },
    },
  }
);

destinationSchema.pre('save', async function (next) {
  if (this.isModified('openingHour') && this.openingHour) {
    this.openingHour.forEach((day) => {
      if (day.isClosed) {
        day.hours = 'Tutup';
      }
    });
  }

  if ((this.isModified('facility') || this.isNew) && this.facility && this.facility.length > 0) {
    const names = this.facility.map((f) => f.name);
    const isUnique = new Set(names).size === names.length;
    if (!isUnique) {
      return next(
        new ResponseError(409, 'Konflik data fasilitas', {
          message: 'Nama fasilitas tidak boleh duplikat dalam satu destinasi.',
        })
      );
    }
  }

  if (this.isModified('destinationTitle') || this.isNew) {
    this.slug = this.destinationTitle
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }

  if (this.isNew) {
    try {
      const subdistrictIdentifier = this.locations.subdistrict;
      let subdistrictDoc;

      if (mongoose.Types.ObjectId.isValid(subdistrictIdentifier)) {
        subdistrictDoc = await Subdistrict.findById(subdistrictIdentifier);
      } else {
        subdistrictDoc = await Subdistrict.findOne({ name: subdistrictIdentifier });
      }

      if (!subdistrictDoc) {
        throw new ResponseError(404, 'Data tidak ditemukan', {
          message: `Kecamatan dengan input "${subdistrictIdentifier}" tidak ditemukan.`,
        });
      }

      const prefix = subdistrictDoc.abbrevation;

      this.locations.subdistrict = subdistrictDoc._id;

      const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);
      let generatedId;
      while (true) {
        const randomPart = nanoid();
        generatedId = `${prefix}-${randomPart}`;
        const existingDestination = await this.constructor.findOne({ destinationsId: generatedId });
        if (!existingDestination) break;
      }
      this.destinationsId = generatedId;
    } catch (error) {
      return next(error);
    }
  }

  next();
});

destinationSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (update.$set && update.$set.openingHour && Array.isArray(update.$set.openingHour)) {
    update.$set.openingHour.forEach((day) => {
      if (day.isClosed) {
        day.hours = 'Tutup';
      }
    });
  }

  if (update.$set && update.$set.destinationTitle) {
    update.$set.slug = update.$set.destinationTitle
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }
  next();
});
destinationSchema.pre('deleteOne', { document: true }, async function (next) {
  if (this.attractions && this.attractions.length > 0) {
    await mongoose.model('Attraction').deleteMany({ _id: { $in: this.attractions } });
  }
  next();
});

export const Destination = mongoose.model('Destination', destinationSchema);
