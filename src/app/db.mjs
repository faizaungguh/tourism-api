import mongoose from 'mongoose';
import * as environment from '#configs/variable.mjs';

const getMongoUri = () => {
  let uri;
  if (environment.MONGO_URI) {
    console.log(
      'Menyambungkan menggunakan MONGO_URI dari environment variables.'
    );
    uri = environment.MONGO_URI;
  } else if (environment.MONGO_USER && environment.MONGO_PASSWORD) {
    console.log('Menyambungkan ke MongoDB dengan autentikasi.');
    uri = `mongodb://${environment.MONGO_USER}:${environment.MONGO_PASSWORD}@${environment.MONGO_IP}:${environment.MONGO_PORT}/${environment.MONGO_DB}?authSource=admin`;
  } else {
    console.log('Menyambungkan ke MongoDB tanpa autentikasi.');
    uri = `mongodb://${environment.MONGO_IP}:${environment.MONGO_PORT}/${environment.MONGO_DB}`;
  }

  const url = new URL(uri);
  if (!url.searchParams.has('retryWrites')) {
    url.searchParams.set('retryWrites', 'false');
  }
  return url.toString();
};

const mongoUri = getMongoUri();

const connectionDB = () => {
  console.log('Mencoba menyambungkan ke MongoDB...');
  mongoose.connect(mongoUri).catch((error) => {
    console.error(
      `Koneksi awal ke DB gagal: ${error.message}. Aplikasi akan keluar.`
    );
    process.exit(1);
  });
};

/** Event listener for a successful connection. */
mongoose.connection.on('connected', () => {
  console.log('Database berhasil terkoneksi');
});

/** Event listener for connection errors. */
mongoose.connection.on('error', (error) => {
  console.error('Error mengkoneksikan ke DB:', error.message);
});

/** Event listener for a disconnection. Mongoose will handle auto-reconnection. */
mongoose.connection.on('disconnected', () => {
  console.log(
    'Koneksi database terputus. Mongoose akan mencoba menyambung kembali secara otomatis.'
  );
});

export default connectionDB;
