import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema(
  {
    adminId: { type: String, unique: true },
    username: { type: String, min: 5, unique: true, max: 12, required: true },
    password: { type: String, min: 6, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    contactNumber: { type: String, required: true },
    photo: { type: String },
    role: { type: String, required: true, enum: ['admin', 'manager'] },
  },
  { timestamps: true }
);

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model('Counter', counterSchema);

adminSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      // 1. Tentukan ID counter dan prefix berdasarkan role
      const counterId = this.role === 'admin' ? 'admin_id' : 'manager_id';
      const prefix = this.role === 'admin' ? 'adm' : 'mng';

      // 2. Temukan dan perbarui dokumen counter secara atomik (mencegah race condition)
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // 3. Format nomor urut dan buat adminId
      const sequence = counter.seq;
      const formattedSequence = String(sequence).padStart(4, '0');
      this.adminId = `${prefix}-${formattedSequence}`;
    } catch (error) {
      return next(new Error('Gagal membuat adminId: ' + error.message));
    }
  }

  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(
        new Error('Gagal melakukan hashing password: ' + error.message)
      );
    }
  }

  next();
});

export const Admin =
  mongoose.models.Admin || mongoose.model('Admin', adminSchema);
