import mongoose from 'mongoose';
import { createRequire } from 'module';
import connectionDB from '#app/db.mjs';
import { SubdistrictSchema } from './schema/subdistrict.mjs';
import { categorySchema } from './schema/category.mjs';
import { adminSchema } from './schema/admin.mjs';

const require = createRequire(import.meta.url);
const subdistrictData = require('../mocks/Subdistricts.json');
const categoryData = require('../mocks/Categories.json');
const adminDefault = require('../mocks/Admin.json');

const Subdistrict = mongoose.model('Subdistrict', SubdistrictSchema);
const Category = mongoose.model('Category', categorySchema);
const Admin = mongoose.model('Admin', adminSchema);

const importAdmin = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data...');

    /**  Menghapus data lama untuk memastikan data bersih */
    await Admin.deleteMany();

    await Admin.create(adminDefault);
    console.log('1 Admin dan 1 Manager berhasil diimpor!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data:', error);
    process.exit(1);
  }
};

const deleteAdmin = async () => {
  try {
    await connectionDB();
    console.log('Memulai menghapus data...');

    /**  Menghapus data lama untuk memastikan data bersih */
    await Admin.deleteMany();

    console.log('Admin dan Manager berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data:', error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data...');

    /** pastikan data bersih */
    await Subdistrict.deleteMany();
    await Category.deleteMany();

    await Subdistrict.create(subdistrictData);
    await Category.create(categoryData);
    console.log('Data Kecamatan dan Kategori berhasil diimpor!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data:', error);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await connectionDB();
    console.log('Memulai delete data...');

    /** Menghapus data lama untuk memastikan data bersih */
    await Subdistrict.deleteMany();
    await Category.deleteMany();

    console.log('Data Kecamatan dan Kategori berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data:', error);
    process.exit(1);
  }
};

const deleteAllData = async () => {
  try {
    await connectionDB();
    console.log(`Memulai penghapusan seluruh koleksi dari database...`);
    await mongoose.connection.dropDatabase();
    console.log('Database berhasil dihapus beserta seluruh koleksinya.');
    process.exit(0);
  } catch (error) {
    console.error('Error saat menghapus database:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '--import-admin') {
  importAdmin();
} else if (process.argv[2] === '--delete-admin') {
  deleteAdmin();
} else if (process.argv[2] === '--import-default') {
  importData();
} else if (process.argv[2] === '--delete-default') {
  deleteData();
} else if (process.argv[2] === '--delete-all') {
  deleteAllData();
}
