import mongoose from 'mongoose';
import { createRequire } from 'module';
import connectionDB from '#app/db.mjs';
import { Admin } from './schema/admin.mjs';
import { Subdistrict } from './schema/subdistrict.mjs';
import { Category } from './schema/category.mjs';

const require = createRequire(import.meta.url);
const subdistrictData = require('../mocks/Subdistricts.json');
const categoryData = require('../mocks/Categories.json');
const multiAdmin = require('../mocks/Admin.json');
const adminDefault = require('../mocks/Default.json');

const importAdmin = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data...');

    /**  Menghapus data lama untuk memastikan data bersih */
    await Admin.deleteMany();

    const createdAdmins = await Admin.create(adminDefault);
    const adminCount = adminDefault.filter(
      (adm) => adm.role === 'admin'
    ).length;
    const managerCount = adminDefault.filter(
      (adm) => adm.role === 'manager'
    ).length;

    console.log(
      `${adminCount} Admin dan ${managerCount} Manager berhasil diimpor! (Total: ${createdAdmins.length})`
    );
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

    const subdistricts = await Subdistrict.create(subdistrictData);
    const categories = await Category.create(categoryData);
    console.log(
      `${subdistricts.length} Kecamatan dan ${categories.length} Kategori berhasil diimpor!`
    );
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

const importAllData = async () => {
  try {
    await connectionDB();
    console.log('Memulai import semua data...');

    await Admin.deleteMany();
    await Subdistrict.deleteMany();
    await Category.deleteMany();
    console.log(
      'Data lama (Admin, Manager, Kecamatan, Kategori) berhasil dihapus.'
    );

    const createdAdmins = await Admin.create(multiAdmin);
    const subdistricts = await Subdistrict.create(subdistrictData);
    const categories = await Category.create(categoryData);

    const adminCount = multiAdmin.filter((adm) => adm.role === 'admin').length;
    const managerCount = multiAdmin.filter(
      (adm) => adm.role === 'manager'
    ).length;

    console.log('\n--- Ringkasan Impor ---');
    console.log(
      `- ${adminCount} Admin dan ${managerCount} Manager berhasil diimpor. (Total: ${createdAdmins.length})`
    );
    console.log(`- ${subdistricts.length} Kecamatan berhasil diimpor.`);
    console.log(`- ${categories.length} Kategori berhasil diimpor.`);
    console.log('-------------------------\n');
    console.log('Semua data default berhasil diimpor!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor semua data:', error);
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
} else if (process.argv[2] === '--import-all') {
  importAllData();
} else if (process.argv[2] === '--delete-all') {
  deleteAllData();
}
