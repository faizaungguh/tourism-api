import { dataService } from '#services/data.mjs';

export const recommendation = {
  show: async (req, res) => {
    const result = await dataService.destination.showRecomendation(req.query);
    res.status(200).json({
      message: 'Menampilkan rekomendasi berdasarkan preferensimu',
      data: result,
    });
  },

  raw: async (req, res) => {
    const result = await dataService.destination.raw(req.query);
    res.status(200).json({
      message: 'Menampilkan data raw semua destinasi untuk pertimbangan Rekomendasi',
      data: result,
    });
  },
};
