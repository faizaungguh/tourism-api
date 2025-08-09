import mongoose from 'mongoose';
import connectionDB from '#app/db.mjs';
import { Admin } from '#schemas/admin.mjs';
import { Subdistrict } from '#schemas/subdistrict.mjs';
import { Category } from '#schemas/category.mjs';
import { Destination } from '#schemas/destination.mjs';
import { Attraction } from '#schemas/attraction.mjs';
import subdistrictData from '../mocks/Subdistricts.json' with { type: 'json' };
import categoryData from '../mocks/Categories.json' with { type: 'json' };
import multiAdmin from '../mocks/Admin.json' with { type: 'json' };
import adminDefault from '../mocks/Default.json' with { type: 'json' };

/** Impor Mock Destination */
import destData1 from '../mocks/ready-seed/seed-destination-01.json' with { type: 'json' };
import destData2 from '../mocks/ready-seed/seed-destination-02.json' with { type: 'json' };
import destData3 from '../mocks/ready-seed/seed-destination-03.json' with { type: 'json' };
import destData4 from '../mocks/ready-seed/seed-destination-04.json' with { type: 'json' };
import destData5 from '../mocks/ready-seed/seed-destination-05.json' with { type: 'json' };
import destData6 from '../mocks/ready-seed/seed-destination-06.json' with { type: 'json' };
import destData7 from '../mocks/ready-seed/seed-destination-07.json' with { type: 'json' };
import attrData1 from '../mocks/ready-seed/seed-attraction-01.json' with { type: 'json' };
import attrData2 from '../mocks/ready-seed/seed-attraction-02.json' with { type: 'json' };

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
    console.log('Data lama (Admin, Manager, Kecamatan, Kategori) berhasil dihapus.');

    const createdAdmins = await Admin.create(multiAdmin);
    const subdistricts = await Subdistrict.create(subdistrictData);
    const categories = await Category.create(categoryData);

    const adminCount = multiAdmin.filter((adm) => adm.role === 'admin').length;
    const managerCount = multiAdmin.filter((adm) => adm.role === 'manager').length;

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

const importTourData = async () => {
  try {
    await connectionDB();
    console.log('🚀 Memulai impor data Destinasi dan Atraksi...');

    await Attraction.deleteMany({});
    await Destination.deleteMany({});
    console.log('🧹 Data destinasi dan atraksi lama berhasil dihapus.');

    const allDestinationsData = [
      ...destData1,
      ...destData2,
      ...destData3,
      ...destData4,
      ...destData5,
      ...destData6,
      ...destData7,
    ];
    
    const allAttractionsData = [
      ...attrData1, 
      ...attrData2, 
    ];
    
    const uniqueDestinationsData = [];
    const seenSlugs = new Set();
    for (const dest of allDestinationsData) {
        const slug = dest.destinationTitle.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^\w-]+/g, '');
        if (!seenSlugs.has(slug)) {
            uniqueDestinationsData.push(dest);
            seenSlugs.add(slug);
        } else {
            console.warn(`🔥 Duplikasi destinasi dengan judul '${dest.destinationTitle}' ditemukan dan dilewati.`);
        }
    }


    const destinationsToCreate = await Promise.all(
      uniqueDestinationsData.map(async (dest) => {
        const manager = await Admin.findOne({ username: dest.createdBy });
        const category = await Category.findOne({ name: dest.category });
        const subdistrict = await Subdistrict.findOne({ name: dest.locations.subdistrict });

        if (!manager) console.warn(`- Manager '${dest.createdBy}' tidak ditemukan untuk ${dest.destinationTitle}`);
        if (!category) console.warn(`- Kategori '${dest.category}' tidak ditemukan untuk ${dest.destinationTitle}`);
        if (!subdistrict) console.warn(`- Kecamatan '${dest.locations.subdistrict}' tidak ditemukan untuk ${dest.destinationTitle}`);

        if (!manager || !category || !subdistrict) {
          console.warn(`--> ⚠️ Destinasi '${dest.destinationTitle}' dilewati karena data pendukung tidak lengkap.`);
          return null;
        }

        return {
          destinationTitle: dest.destinationTitle,
          description: dest.description,
          createdBy: manager._id,
          category: category._id,
          locations: {
            addresses: dest.locations.addresses,
            subdistrict: subdistrict._id,
            coordinates: dest.locations.coordinates,
            mapLink: dest.locations.link,
          },
          openingHour: dest.openingHour,
          ticket: dest.ticket,
          parking: dest.parking,
          facility: dest.facility,
          contact: dest.contact,
        };
      })
    );

    const validDestinations = destinationsToCreate.filter((d) => d !== null);
    const createdDestinations = await Destination.create(validDestinations);
    console.log(`✅ ${createdDestinations.length} Destinasi berhasil diimpor.`);

    const attractionsByDestSlug = new Map();
    for (const attr of allAttractionsData) {
      if (!attractionsByDestSlug.has(attr.destination)) {
        attractionsByDestSlug.set(attr.destination, []);
      }
      attractionsByDestSlug.get(attr.destination).push(attr);
    }

    let createdAttractionsCount = 0;
    for (const destination of createdDestinations) {
      const attractionsForDest = attractionsByDestSlug.get(destination.slug) || [];
      if (attractionsForDest.length > 0) {
        const attractionsToCreate = attractionsForDest.map((attr) => ({
          name: attr.name,
          description: attr.description,
          destination: destination._id,
          ticketType: attr.ticketType,
          ticket: attr.ticket,
        }));

        const newAttractions = await Attraction.create(attractionsToCreate);
        createdAttractionsCount += newAttractions.length;

        const attractionIds = newAttractions.map((a) => a._id);
        await Destination.findByIdAndUpdate(destination._id, {
          $push: { attractions: { $each: attractionIds } },
        });
      }
    }

    console.log(`✅ ${createdAttractionsCount} Atraksi berhasil diimpor dan ditautkan.`);

    
    console.log('\n🔍 Melakukan validasi akhir: Memeriksa destinasi tanpa atraksi...');
    
    
    const destinationsWithoutAttractions = await Destination.find({
      attractions: { $size: 0 },
    }).select('destinationTitle slug'); 

    if (destinationsWithoutAttractions.length === 0) {
      console.log('✅ Sukses! Semua destinasi yang diimpor memiliki setidaknya satu atraksi.');
    } else {
      console.warn(`\n⚠️ PERINGATAN: Ditemukan ${destinationsWithoutAttractions.length} destinasi yang tidak memiliki atraksi:`);
      destinationsWithoutAttractions.forEach(dest => {
        console.warn(`  - ${dest.destinationTitle} (slug: ${dest.slug})`);
      });
      console.warn('\n-> Periksa file seed-attraction-XX.json Anda dan pastikan setiap destinasi di atas memiliki data wahana yang sesuai.');
    }
    

    console.log('\n✨ Impor data wisata selesai!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saat mengimpor data wisata:', error);
    process.exit(1);
  }
}

const deleteTourData = async () => {
  try {
    await connectionDB();
    console.log('🔥 Memulai penghapusan data Destinasi dan Atraksi...');
    await Attraction.deleteMany({});
    await Destination.deleteMany({});
    console.log('🗑️ Data Destinasi dan Atraksi berhasil dihapus!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error saat menghapus data wisata:', error);
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
} else if (process.argv[2] === '--import-tourist') {
  importTourData();
} else if (process.argv[2] === '--delete-tourist') {
  deleteTourData();
} else {
  console.log('Perintah tidak valid. Gunakan flag seperti --import-all atau --delete-all');
}
