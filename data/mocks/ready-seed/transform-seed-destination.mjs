import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'seed-destination.json');

try {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const destinations = JSON.parse(rawData);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const transformTime = (time) => {
    if (!time) return '';
    // Normalize time format: 07.00-17.00 -> 07:00 - 17:00
    return time.replace(/(\d{1,2})[\.:](\d{2})\s*-\s*(\d{1,2})[\.:](\d{2})/, '$1:$2 - $3:$4');
  };

  const transformedDestinations = destinations.map((dest) => {
    const { openingDay, openingHour, ...rest } = dest;
    const formattedHours = transformTime(openingHour);
    let schedule = [];

    if (openingDay === 'Setiap Hari') {
      schedule = days.map((day) => ({
        day,
        hours: formattedHours,
        isClosed: false,
      }));
    } else if (openingDay === 'Selasa-Minggu') {
      schedule = days.map((day) => ({
        day,
        hours: day === 'monday' ? 'Tutup' : formattedHours,
        isClosed: day === 'monday',
      }));
    } else if (openingDay === 'Senin-Jumat') {
      schedule = days.map((day) => {
        const isClosed = day === 'saturday' || day === 'sunday';
        return {
          day,
          hours: isClosed ? 'Tutup' : formattedHours,
          isClosed,
        };
      });
    } else {
      // Default fallback
      schedule = days.map((day) => ({
        day,
        hours: formattedHours,
        isClosed: false,
      }));
    }

    return {
      ...rest,
      openingHour: schedule,
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(transformedDestinations, null, 2));
  console.log(`Successfully transformed ${transformedDestinations.length} destinations.`);
} catch (error) {
  console.error('Error transforming data:', error);
}
