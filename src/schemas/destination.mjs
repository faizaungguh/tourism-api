import mongoose, { Schema } from 'mongoose';

const destinationSchema = new Schema(
  {
    destinationsId: { type: String },
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
        altText: { type: String, trim: true },
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
        name: { type: String, trim: true },
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

destinationSchema.pre('deleteOne', { document: true }, async function (next) {
  if (this.attractions && this.attractions.length > 0) {
    await mongoose
      .model('Attraction')
      .deleteMany({ _id: { $in: this.attractions } });
  }
  next();
});

export const Destination = mongoose.model('Destination', destinationSchema);
