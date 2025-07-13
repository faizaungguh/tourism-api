import { ResponseError } from '#errors/responseError.mjs';
import mongoose from 'mongoose';

export const checkDuplicate = async (dataToUpdate, originalData) => {
  const Admin = mongoose.model('Admin');
  const orConditions = [];

  if (
    dataToUpdate.username &&
    dataToUpdate.username !== originalData.username
  ) {
    orConditions.push({ username: dataToUpdate.username });
  }
  if (dataToUpdate.email && dataToUpdate.email !== originalData.email) {
    orConditions.push({ email: dataToUpdate.email });
  }

  if (orConditions.length > 0) {
    const checkDuplicate = await Admin.findOne({ $or: orConditions });

    if (checkDuplicate) {
      const duplicateErrors = {};
      if (checkDuplicate.username === dataToUpdate.username) {
        duplicateErrors.username =
          'Username ini sudah digunakan oleh akun lain.';
      }
      if (checkDuplicate.email === dataToUpdate.email) {
        duplicateErrors.email = 'Email ini sudah digunakan oleh akun lain.';
      }
      throw new ResponseError(
        409,
        'Data yang diberikan sudah terdaftar.',
        duplicateErrors
      );
    }
  }
};
