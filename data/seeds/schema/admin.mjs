import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;
export const adminSchema = new Schema(
  {
    adminId: { type: String, unique: true },
    username: { type: String, min: 5, max: 12, required: true, unique: true },
    password: { type: String, min: 6, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    contactNumber: { type: String, required: true },
    photo: { type: String },
    role: { type: String, required: true, enum: ['admin', 'manager'] },
  },
  { timestamps: true }
);

adminSchema.pre('save', async function (next) {
  /** cek urutan adminId untuk data baru */
  if (this.isNew) {
    /** mengecek apakah role yang akan disimpan */
    const prefix = this.role === 'admin' ? 'adm' : 'mng';

    /** mengurutkan  dokumen */
    const lastDoc = await this.constructor
      .findOne({ role: this.role })
      .sort({ createdAt: -1 });

    /** increment untuk angka terakhir adminId */
    let sequence = 1;
    if (lastDoc && lastDoc.adminId) {
      const lastSequence = parseInt(lastDoc.adminId.split('-')[1], 10);
      sequence = lastSequence + 1;
    }

    /** memberi nilai pada adminId untuk data baru */
    const formattedSequence = String(sequence).padStart(4, '0');
    this.adminId = `${prefix}-${formattedSequence}`;
  }

  /** hash password jika ada perubahan atau data baru */
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});
