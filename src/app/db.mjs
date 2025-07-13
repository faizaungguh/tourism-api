import mongoose from 'mongoose';
import * as environment from '#configs/variable.mjs';

const RETRY_DELAY = 5000;

const getMongoUri = () => {
  if (environment.MONGO_URI) {
    console.log(
      'Menyambungkan menggunakan MONGO_URI dari environment variables.'
    );
    return environment.MONGO_URI;
  }

  if (environment.MONGO_USER && environment.MONGO_PASSWORD) {
    console.log('Menyambungkan ke MongoDB dengan autentikasi.');
    return `mongodb://${environment.MONGO_USER}:${environment.MONGO_PASSWORD}@${environment.MONGO_IP}:${environment.MONGO_PORT}/${environment.MONGO_DB}?authSource=admin`;
  }

  console.log('Menyambungkan ke MongoDB tanpa autentikasi.');
  return `mongodb://${environment.MONGO_IP}:${environment.MONGO_PORT}/${environment.MONGO_DB}`;
};

const mongoUri = getMongoUri();

const connectionDB = async () => {
  while (true) {
    try {
      await mongoose.connect(mongoUri);
      return;
    } catch (error) {
      console.error(
        `Tidak dapat menyambung ke DB: ${error.message}. Mencoba lagi dalam ${
          RETRY_DELAY / 1000
        } detik...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

/** jika berhasil terkoneksi ke database */
mongoose.connection.on('connected', () => {
  console.log('Database berhasil terkoneksi');
});

/** jika ada error ketika mengkoneksikan ke database */
mongoose.connection.on('error', (error) => {
  console.error('Error mengkoneksikan ke DB:', error.message);
});

/** jika ketika sedang terhubung, tiba-tiba terputus dari port database */
mongoose.connection.on('disconnected', () => {
  console.log('Koneksi database terputus. Mencoba menyambungkan kembali...');
});

export default connectionDB;
