import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '#app/logging.mjs';
import { ResponseError } from '#errors/responseError.mjs';

const adminSchema = new Schema(
  {
    adminId: { type: String, unique: true },
    username: { type: String, min: 5, unique: true, max: 12, required: true },
    password: { type: String, min: 6, required: true },
    name: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    contactNumber: { type: String, required: true },
    photo: { type: String },
    role: { type: String, required: true, enum: ['admin', 'manager'] },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v, delete ret._id, delete ret.password;
      },
    },
  }
);

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

adminSchema.pre('save', async function (next) {
  if (
    this.isNew ||
    this.isModified('username') ||
    this.isModified('email') ||
    this.isModified('name')
  ) {
    const orClauses = [];
    if (this.isNew || this.isModified('username')) orClauses.push({ username: this.username });
    if (this.isNew || this.isModified('email')) orClauses.push({ email: this.email });
    if (this.isNew || this.isModified('name')) orClauses.push({ name: this.name });

    if (orClauses.length > 0) {
      const existingAdmins = await this.constructor.find({ $or: orClauses });
      const errors = {};
      existingAdmins.forEach((admin) => {
        if (admin._id.toString() !== this._id.toString()) {
          if (admin.username === this.username)
            errors.username = 'Username yang anda masukkan telah terdaftar.';
          if (admin.email === this.email)
            errors.email = 'Email yang anda masukkan telah terdaftar.';
          if (admin.name === this.name) errors.name = 'Name yang anda masukkan telah terdaftar.';
        }
      });

      if (Object.keys(errors).length > 0) {
        return next(new ResponseError(409, 'Duplikasi data masukan.', errors));
      }
    }
  }

  if (this.isNew) {
    try {
      const counterId = this.role === 'admin' ? 'admin_id' : 'manager_id';
      const prefix = this.role === 'admin' ? 'adm' : 'mng';
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      const formattedSequence = String(counter.seq).padStart(4, '0');
      this.adminId = `${prefix}-${formattedSequence}`;
    } catch (error) {
      return next(new ResponseError('Gagal membuat adminId: ' + error.message));
    }
  }

  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(new ResponseError('Gagal melakukan hashing password: ' + error.message));
    }
  }

  next();
});

adminSchema.pre('deleteOne', async function (next) {
  try {
    const admin = await this.model.findOne(this.getFilter()).lean();

    if (admin.role === 'manager') {
      const Destination = mongoose.model('Destination');
      const destinationCount = await Destination.countDocuments({
        createdBy: admin._id,
      });

      if (destinationCount > 0) {
        const error = new ResponseError(409, 'Penghapusan Manager gagal', {
          message: `Manajer tidak dapat dihapus karena masih memiliki ${destinationCount} destinasi. Hapus destinasi terlebih dahulu.`,
        });
        return next(error);
      }
    }

    if (admin.photo) {
      const relativePhotoDir = path.dirname(admin.photo);
      const absolutePhotoDir = path.join(process.cwd(), 'public', relativePhotoDir);

      await fs.rm(absolutePhotoDir, { recursive: true, force: true }).catch((error) => {
        logger.error('Gagal menghapus folder foto admin saat proses penghapusan', {
          adminId: admin.adminId,
          path: absolutePhotoDir,
          error: { message: error.message, stack: error.stack },
        });
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
