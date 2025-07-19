import { ResponseError } from '#errors/responseError.mjs';
import { Admin } from '#schemas/admin.mjs';

export const checkDuplicate = async (dataToUpdate, originalData = null) => {
  const orConditions = [];

  if (
    dataToUpdate.username &&
    (!originalData || dataToUpdate.username !== originalData.username)
  ) {
    orConditions.push({ username: dataToUpdate.username });
  }

  if (
    dataToUpdate.email &&
    (!originalData || dataToUpdate.email !== originalData.email)
  ) {
    orConditions.push({ email: dataToUpdate.email });
  }

  if (orConditions.length > 0) {
    const duplicateDoc = await Admin.findOne({ $or: orConditions });

    if (duplicateDoc) {
      const duplicateErrors = {};
      if (duplicateDoc.username === dataToUpdate.username) {
        duplicateErrors.username = 'Username sudah digunakan.';
      }
      if (duplicateDoc.email === dataToUpdate.email) {
        duplicateErrors.email = 'Email sudah digunakan.';
      }
      throw new ResponseError(
        409,
        'Data yang diberikan sudah terdaftar.',
        duplicateErrors
      );
    }
  }
};
