import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tourism_api';
const RETRY_DELAY = 5000;

const connectionDB = () => {
  return new Promise((resolve) => {
    const connect = () => {
      mongoose.connect(MONGO_URI)
        .then(() => {
          resolve();
        })
        .catch(error => {
          console.error(`Tidak dapat menyambung ke DB: ${error.message}. Mencoba lagi dalam ${RETRY_DELAY / 1000} detik...`);
          setTimeout(connect, RETRY_DELAY);
        });
    };

    connect();
  });
};

// jika berhasil terkoneksi ke database
mongoose.connection.on('connected', () => {
  console.log("Database berhasil terkoneksi");
});

// jika ada error ketika mengkoneksikan ke database
mongoose.connection.on('error', (error) => {
  console.error("Error mengkoneksikan ke DB:", error.message);
});

// jika ketika sedang terhubung, tiba-tiba terputus dari port database
mongoose.connection.on('disconnected', () => {
  console.log("Koneksi database terputus. Mencoba menyambungkan kembali...");
});

export default connectionDB;