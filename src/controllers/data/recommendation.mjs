import { dataService } from '#services/data.mjs';

export const recommendation = {
  show: async (req, res) => {
    const result = await dataService.destination.showRecomendation(req.query);
    res.status(200).json({
      message: 'Menampilkan rekomendasi berdasarkan preferensimu',
      data: result,
    });
  },
};
