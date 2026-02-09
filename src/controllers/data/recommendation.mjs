import { dataService } from '#services/index.mjs';

export const recommendationData = {
  show: async (req, res) => {
    const result = await dataService.destination.showRecomendation(req.query);
    res.status(200).json({
      message: 'Menampilkan rekomendasi berdasarkan preferensimu',
      data: result,
    });
  },

  raw: async (req, res) => {
    const result = await dataService.destination.raw(req.query);

    if (req.query.export === 'csv' || req.query.export === 'excel') {
      const headers = [
        'destinationName',
        'category',
        'subdistrict',
        'lat',
        'long',
        'attractionCount',
        'facilityCount',
        'ticket_adult',
        'ticket_child',
        'parking_motorcycle',
        'parking_car',
        'parking_bus',
      ];

      const flatData = result.map((item) => ({
        destinationName: item.destinationName,
        category: item.category,
        subdistrict: item.subdistrict,
        lat: item.lat,
        long: item.long,
        attractionCount: item.attractionCount,
        facilityCount: item.facilityCount,
        ticket_adult: item.ticketPrice?.adult || 0,
        ticket_child: item.ticketPrice?.child || 0,
        parking_motorcycle: item.parkingCapacity?.motorcycle?.capacity || 0,
        parking_car: item.parkingCapacity?.car?.capacity || 0,
        parking_bus: item.parkingCapacity?.bus?.capacity || 0,
      }));

      const csvContent = [
        headers.join(','),
        ...flatData.map((row) =>
          headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','),
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="destinations_raw.csv"');
      return res.status(200).send(csvContent);
    }

    res.status(200).json({
      message: 'Menampilkan data raw semua destinasi untuk pertimbangan Rekomendasi',
      data: result,
    });
  },
};
