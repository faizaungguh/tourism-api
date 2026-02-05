import mongoose from 'mongoose';
import connectionDB from '#app/db.mjs';
import { Admin } from '#schemas/admin.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { Category } from '#schemas/category.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Attraction } from '#schemas/attraction.mjs';

import adminDefault from '../mocks/Admin.json' with { type: 'json' };
import subdistrictData from '../mocks/Subdistricts.json' with { type: 'json' };
import categoryData from '../mocks/Categories.json' with { type: 'json' };
import destinationData from '../mocks/ready-seed/seed-destination.json' with { type: 'json' };

const importAdmin = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data...');

    /**  Menghapus data lama untuk memastikan data bersih */
    await Admin.deleteMany();

    const createdAdmins = await Admin.create(adminDefault);
    const adminCount = adminDefault.filter((adm) => adm.role === 'admin').length;
    const managerCount = adminDefault.filter((adm) => adm.role === 'manager').length;

    console.log(
      `${adminCount} Admin dan ${managerCount} Manager berhasil diimpor! (Total: ${createdAdmins.length})`,
    );
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data:', error);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data referensi (Kecamatan & Kategori)...');

    /** pastikan data bersih */
    await Subdistrict.deleteMany();
    await Category.deleteMany();

    const subdistricts = await Subdistrict.create(subdistrictData);
    const categories = await Category.create(categoryData);
    console.log(
      `${subdistricts.length} Kecamatan dan ${categories.length} Kategori berhasil diimpor!`,
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
    console.log('Memulai delete data referensi...');

    /** Menghapus data lama untuk memastikan data bersih */
    await Subdistrict.deleteMany();
    await Category.deleteMany();

    console.log('Data Kecamatan dan Kategori berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat menghapus data:', error);
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

const importDestination = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data Destinasi...');

    /** Menghapus data lama untuk memastikan data bersih */
    await Destination.deleteMany();

    const categories = await Category.find();
    const subdistricts = await Subdistrict.find();
    const defaultManager = await Admin.findOne({ username: 'manager01' });

    if (!defaultManager) {
      throw new Error(
        'Default manager (manager01) tidak ditemukan. Pastikan sudah menjalankan --import-admin',
      );
    }

    const formattedDestinations = [];

    for (const item of destinationData) {
      const jsonCat = (item.category || '').toLowerCase();
      const category = categories.find((cat) => {
        const dbCat = cat.name.toLowerCase();
        return dbCat === jsonCat || jsonCat.includes(dbCat);
      });

      const rawSubdistrict = item.subdistrict || item['subdistrict '] || '';
      const jsonSub = rawSubdistrict.trim().toLowerCase();
      const subdistrict = subdistricts.find((sub) => {
        const dbSub = sub.name.toLowerCase();
        return dbSub === jsonSub || jsonSub.includes(dbSub);
      });

      if (!category) {
        console.warn(
          `[SKIP] Kategori "${item.category}" tidak ditemukan untuk: ${item.destinationTitle}`,
        );
        continue;
      }

      if (!subdistrict) {
        console.warn(
          `[SKIP] Kecamatan "${rawSubdistrict}" tidak ditemukan untuk: ${item.destinationTitle}`,
        );
        continue;
      }

      formattedDestinations.push({
        destinationTitle: item.destinationTitle,
        category: category._id,
        createdBy: defaultManager._id,
        description: item.description,
        locations: {
          addresses: item.addresses,
          link: `https://maps.google.com/?q=${item.lat},${item.long}`,
          subdistrict: subdistrict._id,
          coordinates: {
            lat: parseFloat(item.lat),
            long: parseFloat(item.long),
          },
        },
        openingHour: item.openingHour,
        facility: [],
        contact: [],
        ticket: {
          adult: 0,
          child: 0,
        },
        parking: {
          motorcycle: {
            capacity: 0,
            price: 0,
          },
          car: {
            capacity: 0,
            price: 0,
          },
        },
      });
    }

    const destinations = await Destination.create(formattedDestinations);
    console.log(`${destinations.length} Destinasi berhasil diimpor!`);
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data destinasi:', error);
    process.exit(1);
  }
};

const deleteDestination = async () => {
  try {
    await connectionDB();
    console.log('Memulai menghapus data Destinasi...');

    /** Menghapus data lama untuk memastikan data bersih */
    await Destination.deleteMany();

    console.log('Data Destinasi berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat menghapus data destinasi:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '--import-admin') {
  importAdmin();
} else if (process.argv[2] === '--delete-admin') {
  deleteAdmin();
} else if (process.argv[2] === '--import-data') {
  importData();
} else if (process.argv[2] === '--delete-data') {
  deleteData();
} else if (process.argv[2] === '--import-destination') {
  importDestination();
} else if (process.argv[2] === '--delete-destination') {
  deleteDestination();
} else {
  console.log(
    'Perintah tidak valid. Gunakan flag: --import-admin, --delete-admin, --import-data, --delete-data',
  );
}
