import mongoose from "mongoose";
import {
  MONGO_URI as mongoUri,
  MONGO_IP,
  MONGO_PASSWORD,
  MONGO_PORT,
  MONGO_USER,
  MONGO_DB,
} from "../configs/variable.mjs";

const RETRY_DELAY = 5000;

const getMongoUri = () => {
  if (mongoUri) {
    console.log("Menyambungkan menggunakan MONGO_URI dari environment variables.");
    return mongoUri;
  }

  if (MONGO_USER && MONGO_PASSWORD) {
    console.log("Menyambungkan ke MongoDB dengan autentikasi.");
    return `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;
  }

  console.log("Menyambungkan ke MongoDB tanpa autentikasi.");
  return `mongodb://${MONGO_IP}:${MONGO_PORT}/${MONGO_DB}`;
};

const MONGO_URI = getMongoUri();

const connectionDB = async () => {
  while (true) {
    try {
      await mongoose.connect(MONGO_URI);
      return;
    } catch (error) {
      console.error(`Tidak dapat menyambung ke DB: ${error.message}. Mencoba lagi dalam ${RETRY_DELAY / 1000} detik...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
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