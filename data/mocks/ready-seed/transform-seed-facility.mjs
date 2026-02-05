import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'seed-facility.json');

try {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const facilitiesData = JSON.parse(rawData);

  const groupedData = {};

  facilitiesData.forEach((item) => {
    const destTitle = item.destinationTitle;
    // Mengambil nilai facility, menangani kemungkinan key dengan spasi "facility "
    const facilityNameRaw = item['facility '] || item['facility'];

    if (!destTitle || !facilityNameRaw) return;

    // Membersihkan nama fasilitas (hapus spasi di awal/akhir dan titik di akhir)
    const facilityName = facilityNameRaw.trim().replace(/\.$/, '');

    if (!groupedData[destTitle]) {
      groupedData[destTitle] = {
        destinations: destTitle, // Mengubah key menjadi 'destinations' sesuai permintaan
        facility: [],
      };
    }

    groupedData[destTitle].facility.push({
      name: facilityName,
      availability: true,
      number: 2,
      disabilityAccess: true,
    });
  });

  const transformedFacilities = Object.values(groupedData);

  fs.writeFileSync(filePath, JSON.stringify(transformedFacilities, null, 2));
  console.log(
    `Successfully transformed facilities for ${transformedFacilities.length} destinations.`,
  );
} catch (error) {
  console.error('Error transforming facility data:', error);
}
