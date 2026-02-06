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
import parkingData from '../mocks/ready-seed/seed-parking.json' with { type: 'json' };
import contactData from '../mocks/ready-seed/seed-contact.json' with { type: 'json' };

class Seeder {
  /** Admin */
  static async importAdmin() {
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
  }

  static async deleteAdmin() {
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
  }

  /** Default Data*/
  static async importDefault() {
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
  }

  static async deleteDefault() {
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
  }

  /** Destinasi*/
  static async importDestination() {
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
  }

  static async deleteDestination() {
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
  }

  /** Harga Tiket*/
  static async importTicketDestination() {
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
  }

  static async deleteTicketDestination() {
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
  }
  /** Wahana*/
  static async importAttraction() {
    try {
      await connectionDB();
      console.log('Memulai import data Atraksi...');

      await Attraction.deleteMany();
      await Destination.updateMany({}, { attraction: [] });

      const destinations = await Destination.find();
      const formattedAttractions = [];
      let notFoundCount = 0;

      for (const item of attractionData) {
        const rawDestination = item.destinationTitle || '';
        const jsonDest = rawDestination.trim().toLowerCase();

        if (!jsonDest) continue;

        const destination = destinations.find((dest) => {
          const dbTitle = dest.destinationTitle.trim().toLowerCase();
          return dbTitle === jsonDest;
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

      const updates = {};
      for (const attr of attractions) {
        const destId = attr.destination.toString();
        if (!updates[destId]) updates[destId] = [];
        updates[destId].push(attr._id);
      }

      for (const [destId, attrIds] of Object.entries(updates)) {
        await Destination.findByIdAndUpdate(destId, { attractions: attrIds });
      }

      console.log(`${attractions.length} Atraksi berhasil diimpor! (${notFoundCount} dilewati)`);
      process.exit(0);
    } catch (error) {
      console.error('Error saat mengimpor data atraksi:', error);
      process.exit(1);
    }
  }

  static async deleteAttraction() {
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
  }
  /** Fasilitas*/
  static async importFacility() {
    try {
      await connectionDB();
      console.log('Memulai import data Fasilitas Destinasi...');

      const destinations = await Destination.find();
      const facilitiesMap = new Map();
      let notFoundCount = 0;

      for (const item of facilityData) {
        const rawTitle = item.destinationTitle || '';
        const jsonTitle = rawTitle.trim().toLowerCase();

        if (!jsonTitle) continue;

        const destination = destinations.find((dest) => {
          const dbTitle = dest.destinationTitle.trim().toLowerCase();
          const dbSlug = dest.slug || dbTitle.replace(/\s+/g, '-');

          if (dbTitle === jsonTitle || dbSlug === jsonTitle) return true;

          const jsonParts = jsonTitle.split(/[\s-]+/).filter(Boolean);
          return jsonParts.length > 0 && jsonParts.every((part) => dbTitle.includes(part));
        });

        if (destination) {
          const destId = destination._id.toString();
          if (!facilitiesMap.has(destId)) {
            facilitiesMap.set(destId, { destination, facilities: [] });
          }

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
  }

  static async deleteFacility() {
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
  }

  /** Parkir*/
  static async importParking() {
    try {
      await connectionDB();
      console.log('Memulai import data Parkir Destinasi...');

      const destinations = await Destination.find();
      let updatedCount = 0;
      let notFoundCount = 0;

      for (const item of parkingData) {
        const rawTitle = item.destinationTitle || '';
        const jsonTitle = rawTitle.trim().toLowerCase();

        if (!jsonTitle) continue;

        const destination = destinations.find((dest) => {
          const dbTitle = dest.destinationTitle.trim().toLowerCase();
          const dbSlug = dest.slug || dbTitle.replace(/\s+/g, '-');

          if (dbTitle === jsonTitle || dbSlug === jsonTitle) return true;

          const jsonParts = jsonTitle.split(/[\s-]+/).filter(Boolean);
          return jsonParts.length > 0 && jsonParts.every((part) => dbTitle.includes(part));
        });

        if (destination) {
          destination.parking = {
            motorcycle: item.motorcycle || { capacity: 0, price: 0 },
            car: item.car || { capacity: 0, price: 0 },
            bus: item.bus || { capacity: 0, price: 0 },
          };
          await destination.save();
          updatedCount++;
        } else {
          notFoundCount++;
        }
      }

      console.log(
        `${updatedCount} Destinasi berhasil diperbarui data parkirnya! (${notFoundCount} dilewati)`,
      );
      process.exit(0);
    } catch (error) {
      console.error('Error saat mengimpor data parkir:', error);
      process.exit(1);
    }
  }

  static async deleteParking() {
    try {
      await connectionDB();
      console.log('Memulai reset data Parkir Destinasi...');

      await Destination.updateMany(
        {},
        {
          parking: {
            motorcycle: { capacity: 0, price: 0 },
            car: { capacity: 0, price: 0 },
            bus: { capacity: 0, price: 0 },
          },
        },
      );

      console.log('Data Parkir Destinasi berhasil di-reset!');
      process.exit(0);
    } catch (error) {
      console.error('Error saat mereset data parkir:', error);
      process.exit(1);
    }
  }

  /** Kontak*/
  static async importContact() {
    try {
      await connectionDB();
      console.log('Memulai import data Kontak Destinasi...');

      const destinations = await Destination.find();
      let updatedCount = 0;
      let notFoundCount = 0;

      const validPlatforms = [
        'phone',
        'email',
        'instagram',
        'youtube',
        'whatsapp',
        'website',
        'facebook',
        'tiktok',
      ];

      for (const item of contactData) {
        const rawTitle = item.destinationTitle || '';
        const jsonTitle = rawTitle.trim().toLowerCase();

        if (!jsonTitle) continue;

        const destination = destinations.find((dest) => {
          const dbTitle = dest.destinationTitle.trim().toLowerCase();
          const dbSlug = dest.slug || dbTitle.replace(/\s+/g, '-');

          if (dbTitle === jsonTitle || dbSlug === jsonTitle) return true;

          const jsonParts = jsonTitle.split(/[\s-]+/).filter(Boolean);
          return jsonParts.length > 0 && jsonParts.every((part) => dbTitle.includes(part));
        });

        if (destination) {
          const contacts = [];
          for (const key of Object.keys(item)) {
            const platform = key.trim().toLowerCase();
            if (validPlatforms.includes(platform) && item[key]) {
              contacts.push({
                platform: platform,
                value: String(item[key]).trim(),
              });
            }
          }

          if (contacts.length > 0) {
            destination.contact = contacts;
            await destination.save();
            updatedCount++;
          }
        } else {
          notFoundCount++;
        }
      }

      console.log(
        `${updatedCount} Destinasi berhasil diperbarui kontaknya! (${notFoundCount} dilewati)`,
      );
      process.exit(0);
    } catch (error) {
      console.error('Error saat mengimpor data kontak:', error);
      process.exit(1);
    }
  }

  static async deleteContact() {
    try {
      await connectionDB();
      console.log('Memulai reset data Kontak Destinasi...');

      await Destination.updateMany({}, { contact: [] });

      console.log('Data Kontak Destinasi berhasil di-reset!');
      process.exit(0);
    } catch (error) {
      console.error('Error saat mereset data kontak:', error);
      process.exit(1);
    }
  }
}

switch (process.argv[2]) {
  /** Admin */
  case '--import-admin':
    Seeder.importAdmin();
    break;
  case '--delete-admin':
    Seeder.deleteAdmin();
    break;
  /** Default Subdistrict-Category */
  case '--import-default':
    Seeder.importDefault();
    break;
  case '--delete-default':
    Seeder.deleteDefault();
    break;
  /** Data Destinasi */
  case '--import-destination':
    Seeder.importDestination();
    break;
  case '--delete-destination':
    Seeder.deleteDestination();
    break;
  /** Data Tiket Destinasi */
  case '--import-ticket-destination':
    Seeder.importTicketDestination();
    break;
  case '--delete-ticket-destination':
    Seeder.deleteTicketDestination();
    break;
  /** Data Wahana */
  case '--import-attraction':
    Seeder.importAttraction();
    break;
  case '--delete-attraction':
    Seeder.deleteAttraction();
    break;
  /** Data Fasilitas */
  case '--import-facility':
    Seeder.importFacility();
    break;
  case '--delete-facility':
    Seeder.deleteFacility();
    break;
  /** Data Parkir */
  case '--import-parking':
    Seeder.importParking();
    break;
  case '--delete-parking':
    Seeder.deleteParking();
    break;
  /** Data Kontak */
  case '--import-contact':
    Seeder.importContact();
    break;
  case '--delete-contact':
    Seeder.deleteContact();
    break;
  default:
    console.error(
      'Perintah tidak valid. Gunakan flag: --import-admin --delete-admin --import-data --delete-data --import-destination --delete-destination --import-ticket-destination --delete-ticket-destination --import-attraction --delete-attraction --import-facility --delete-facility --import-parking --delete-parking --import-contact --delete-contact',
    );
}
