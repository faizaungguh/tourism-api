import mongoose from 'mongoose';

const Schema = mongoose.Schema;
export const destinationSchema = new Schema(
  {
    destinationsId: { type: String },
    destinationTitle: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    categories: {
      type: Schema.Types.ObjectId,
      ref: 'Categories',
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: true },
    description: { type: String, required: true },
    profilePhoto: { type: String },
    headlinePhoto: { type: String },
    galleryPhoto: [
      {
        url: { type: String },
        caption: { type: String, trim: true },
        altText: { type: String, trim: true },
      },
    ],
    locations: {
      adresses: { type: String, required: true },
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
          required: true,
          enum: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ],
        },
        hours: { type: String, default: 'Tutup' },
        isClosed: { type: Boolean, default: false },
      },
    ],
    attractions: [{ type: Schema.Types.ObjectId, ref: 'Attraction' }],
    facility: [
      {
        name: { type: String, required: true, trim: true },
        availability: { type: Boolean, default: false },
        number: { type: Number, default: 0 },
        disabilityAccess: { type: Boolean, default: false },
        photo: { type: [String], default: [] },
      },
    ],
    contact: [
      {
        platform: {
          type: String,
          required: true,
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
        value: { type: String, required: true, trim: true },
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
  { timestamps: true }
);

destinationSchema.pre('save', async function (next) {
  if (this.isModified('destinationTitle') || this.isNew) {
    this.slug = this.destinationTitle
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }
  next();
});

destinationSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.destinationTitle) {
    update.$set.slug = update.$set.destinationTitle
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');
  }
  next();
});
