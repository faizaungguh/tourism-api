import bcrypt from 'bcrypt';

export const passwordUpdate = async (passwords, correctHashedPassword) => {
  const { oldPassword, newPassword } = passwords;

  if (!oldPassword || !newPassword) {
    throw new ResponseError(422, 'Data kosong.', {
      message: 'Anda harus memasukkan password lama dan password baru anda',
    });
  }

  const isPasswordMatch = await bcrypt.compare(
    oldPassword,
    correctHashedPassword
  );

  if (!isPasswordMatch) {
    throw new ResponseError(400, 'Password tidak sesuai', {
      oldPassword: 'Password lama yang Anda masukkan salah.',
    });
  }

  if (newPassword === oldPassword) {
    throw new ResponseError(
      400,
      'Password baru tidak boleh sama dengan password lama.',
      {
        newPassword: 'Password baru tidak boleh sama dengan yang lama.',
      }
    );
  }

  return bcrypt.hash(newPassword, 10);
};
