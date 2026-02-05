import mongoose, { Schema } from 'mongoose';
import { customAlphabet, nanoid } from 'nanoid';
import { Attraction } from 'schemas/attraction.mjs';
import { Subdistrict } from 'schemas/subdistrict.mjs';
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
        photoId: { type: String, trim: true },
        caption: { type: String, trim: true },
      },
    ],
    locations: {
      addresses: { type: String },
      link: { type: String },
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
        slug: { type: String, lowercase: true, trim: true },
        availability: { type: Boolean, default: false },
        number: { type: Number, default: 0 },
        disabilityAccess: { type: Boolean, default: false },
        photo: [
          {
            url: { type: String },
            photoId: { type: String, trim: true },
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
            'youtube',
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
        (delete ret.__v, delete ret._id);
      },
    },
  },
);

export function processOpeningHours(openingHours) {
  if (openingHours && Array.isArray(openingHours)) {
    openingHours.forEach((day) => {
      if (day.isClosed) {
        day.hours = 'Tutup';
      }
    });
  }
}

function createSlug(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

function generatePhotoCaptions(doc) {
  const title = doc.destinationTitle;
  if (!title) return;

  if (doc.galleryPhoto && doc.galleryPhoto.length > 0) {
    doc.galleryPhoto.forEach((photo) => {
      photo.caption = `Foto Galeri ${title}`;
    });
  }

  if (doc.facility && doc.facility.length > 0) {
    doc.facility.forEach((facilityItem) => {
      if (facilityItem.photo && facilityItem.photo.length > 0) {
        facilityItem.photo.forEach((photo) => {
          photo.caption = `Foto Fasilitas ${facilityItem.name} di ${title}`;
        });
      }
    });
  }
}

destinationSchema.pre('save', async function (next) {
  processOpeningHours(this.openingHour);

  if ((this.isModified('facility') || this.isNew) && this.facility && this.facility.length > 0) {
    const names = this.facility.map((f) => f.name);
    if (new Set(names).size !== names.length) {
      return next(
        new ResponseError(409, 'Duplikasi data.', {
          message: 'Nama fasilitas tidak boleh duplikat.',
        }),
      );
    }

    this.facility.forEach((facility) => {
      if (facility.isModified('name') || !facility.slug) {
        facility.slug = createSlug(facility.name);
      }
    });
  }

  if (
    this.isNew ||
    this.isModified('galleryPhoto') ||
    this.isModified('facility') ||
    this.isModified('destinationTitle')
  ) {
    generatePhotoCaptions(this);
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
        if (!existingDestination) {
          break;
        }
      }
      this.destinationsId = generatedId;
    } catch (error) {
      return next(error);
    }
  }

  if (this.isModified('destinationTitle') || this.isNew) {
    const baseSlug = this.destinationTitle
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    let slug = baseSlug;
    let isUnique = false;
    while (!isUnique) {
      const query = { slug: slug };
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

destinationSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();
  processOpeningHours(update.$set?.openingHour);

  if (
    update.$set &&
    (update.$set.galleryPhoto || update.$set.facility || update.$set.destinationTitle)
  ) {
    const docToUpdate = await this.model.findOne(this.getQuery()).lean();
    const destinationTitle = update.$set.destinationTitle || docToUpdate.destinationTitle;

    const tempDoc = {
      destinationTitle,
      galleryPhoto: update.$set.galleryPhoto || docToUpdate.galleryPhoto,
      facility: update.$set.facility || docToUpdate.facility,
    };

    generatePhotoCaptions(tempDoc);

    if (update.$set.galleryPhoto) update.$set.galleryPhoto = tempDoc.galleryPhoto;
    if (update.$set.facility) update.$set.facility = tempDoc.facility;
  }

  if (update.$set && update.$set.destinationTitle) {
    const baseSlug = update.$set.destinationTitle
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, '');

    let slug = baseSlug;
    let isUnique = false;
    while (!isUnique) {
      const query = {
        slug: slug,
        _id: { $ne: this.getQuery()._id },
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

destinationSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const destinationToDelete = this;

    if (destinationToDelete.attractions && destinationToDelete.attractions.length > 0) {
      await Attraction.deleteMany({ _id: { $in: destinationToDelete.attractions } });
    }

    next();
  } catch (error) {
    next(error);
  }
});

export const Destination =
  mongoose.models.Destination || mongoose.model('Destination', destinationSchema);
