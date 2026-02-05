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
import ticketPriceData from '../mocks/ready-seed/seed-ticketPrice.json' with { type: 'json' };
import attractionData from '../mocks/ready-seed/seed-attraction.json' with { type: 'json' };
import facilityData from '../mocks/ready-seed/seed-facility.json' with { type: 'json' };

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

const importTicketDestination = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data harga tiket destinasi...');

    const destinations = await Destination.find();
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const item of ticketPriceData) {
      const titleKey = Object.keys(item).find((k) => k.trim() === 'destinationTitle');
      const priceKey = Object.keys(item).find((k) => k.trim() === 'ticketPrice');

      const rawTitle = titleKey ? item[titleKey] : null;
      const rawPrice = priceKey ? item[priceKey] : 0;

      if (!rawTitle) {
        continue;
      }

      const jsonTitle = rawTitle.trim().toLowerCase();
      const destination = destinations.find(
        (dest) => dest.destinationTitle.trim().toLowerCase() === jsonTitle,
      );

      if (destination) {
        destination.ticket = {
          adult: Number(rawPrice) || 0,
          child: 0,
        };
        await destination.save();
        updatedCount++;
      } else {
        console.warn(`[SKIP] Destinasi "${rawTitle}" tidak ditemukan.`);
        notFoundCount++;
      }
    }

    console.log(`${updatedCount} harga tiket berhasil diperbarui! (${notFoundCount} dilewati)`);
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data harga tiket:', error);
    process.exit(1);
  }
};

const deleteTicketDestination = async () => {
  try {
    await connectionDB();
    console.log('Memulai reset data harga tiket destinasi...');

    await Destination.updateMany({}, { ticket: { adult: 0, child: 0 } });

    console.log('Data harga tiket destinasi berhasil di-reset!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat mereset data harga tiket:', error);
    process.exit(1);
  }
};

const importAttraction = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data Atraksi...');

    await Attraction.deleteMany();

    const destinations = await Destination.find();
    const formattedAttractions = [];
    let notFoundCount = 0;

    for (const item of attractionData) {
      const rawDestination = item.destination || '';
      const jsonDest = rawDestination.trim().toLowerCase();

      // Mencari destinasi berdasarkan destinationTitle
      const destination = destinations.find((dest) => {
        const dbTitle = dest.destinationTitle.trim().toLowerCase();
        const dbSlug = dest.slug || dbTitle.replace(/\s+/g, '-');

        // 1. Cek exact match dengan title atau slug
        if (dbTitle === jsonDest || dbSlug === jsonDest) return true;

        // 2. Cek fleksibel: pecah kata dari seed (misal "menara-teratai") dan cek apakah ada di title DB ("menara pandang teratai")
        const jsonParts = jsonDest.split(/[\s-]+/).filter(Boolean);
        return jsonParts.length > 0 && jsonParts.every((part) => dbTitle.includes(part));
      });

      if (!destination) {
        console.warn(
          `[SKIP] Destinasi "${rawDestination}" tidak ditemukan untuk atraksi: ${item.name}`,
        );
        notFoundCount++;
        continue;
      }

      formattedAttractions.push({
        name: item.name,
        description: item.description || 'Objek Wisata di Kabupaten Banyumas',
        ticketType: item.ticketType || 'gratis',
        ticket: item.ticket,
        destination: destination._id,
      });
    }

    const attractions = await Attraction.create(formattedAttractions);
    console.log(`${attractions.length} Atraksi berhasil diimpor! (${notFoundCount} dilewati)`);
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data atraksi:', error);
    process.exit(1);
  }
};

const deleteAttraction = async () => {
  try {
    await connectionDB();
    console.log('Memulai menghapus data Atraksi...');

    await Attraction.deleteMany();

    console.log('Data Atraksi berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat menghapus data atraksi:', error);
    process.exit(1);
  }
};

const importFacility = async () => {
  try {
    await connectionDB();
    console.log('Memulai import data Fasilitas Destinasi...');

    const destinations = await Destination.find();
    // Menggunakan Map untuk mengelompokkan fasilitas berdasarkan ID destinasi
    const facilitiesMap = new Map();
    let notFoundCount = 0;

    for (const item of facilityData) {
      const rawTitle = item.destinationTitle || '';
      const jsonTitle = rawTitle.trim().toLowerCase();

      if (!jsonTitle) continue;

      // Mencari destinasi berdasarkan destinationTitle
      const destination = destinations.find((dest) => {
        const dbTitle = dest.destinationTitle.trim().toLowerCase();
        const dbSlug = dest.slug || dbTitle.replace(/\s+/g, '-');

        // 1. Cek exact match dengan title atau slug
        if (dbTitle === jsonTitle || dbSlug === jsonTitle) return true;

        // 2. Cek fleksibel
        const jsonParts = jsonTitle.split(/[\s-]+/).filter(Boolean);
        return jsonParts.length > 0 && jsonParts.every((part) => dbTitle.includes(part));
      });

      if (destination) {
        const destId = destination._id.toString();
        if (!facilitiesMap.has(destId)) {
          facilitiesMap.set(destId, { destination, facilities: [] });
        }

        // Menangani key yang mungkin kotor (ada spasi di key atau value)
        const daKey = Object.keys(item).find((k) => k.trim() === 'disabilityAccess');
        const daValue = daKey ? String(item[daKey]).trim().toUpperCase() : 'FALSE';
        const availValue = String(item.availability || '')
          .trim()
          .toUpperCase();

        facilitiesMap.get(destId).facilities.push({
          name: (item.facility || '').trim(),
          availability: availValue === 'TRUE',
          number: parseInt(item.number) || 0,
          disabilityAccess: daValue === 'TRUE',
        });
      } else {
        // console.warn(`[SKIP] Destinasi "${rawTitle}" tidak ditemukan untuk import fasilitas.`);
        notFoundCount++;
      }
    }

    let updatedCount = 0;
    for (const { destination, facilities } of facilitiesMap.values()) {
      destination.facility = facilities;
      await destination.save();
      updatedCount++;
    }

    console.log(
      `${updatedCount} Destinasi berhasil diperbarui fasilitasnya! (${notFoundCount} item fasilitas dilewati)`,
    );
    process.exit(0);
  } catch (error) {
    console.error('Error saat mengimpor data fasilitas:', error);
    process.exit(1);
  }
};

const deleteFacility = async () => {
  try {
    await connectionDB();
    console.log('Memulai menghapus data Fasilitas Destinasi...');

    await Destination.updateMany({}, { facility: [] });

    console.log('Data Fasilitas Destinasi berhasil dihapus (direset)!');
    process.exit(0);
  } catch (error) {
    console.error('Error saat menghapus data fasilitas:', error);
    process.exit(1);
  }
};

switch (process.argv[2]) {
  /** Admin */
  case '--import-admin':
    importAdmin();
    break;
  case '--delete-admin':
    deleteAdmin();
    break;
  /** Default Subdistrict-Category */
  case '--import-data':
    importData();
    break;
  case '--delete-data':
    deleteData();
    break;
  /** Data Destinasi */
  case '--import-destination':
    importDestination();
    break;
  case '--delete-destination':
    deleteDestination();
    break;
  /** Data Tiket Destinasi */
  case '--import-ticket-destination':
    importTicketDestination();
    break;
  case '--delete-ticket-destination':
    deleteTicketDestination();
    break;
  /** Data Wahana */
  case '--import-attraction':
    importAttraction();
    break;
  case '--delete-attraction':
    deleteAttraction();
    break;
  /** Data Fasilitas */
  case '--import-facility':
    importFacility();
    break;
  case '--delete-facility':
    deleteFacility();
    break;
  default:
    console.log(
      'Perintah tidak valid. Gunakan flag: --import-admin, --delete-admin, --import-data, --delete-data',
    );
}
