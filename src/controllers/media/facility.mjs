import { mediaService } from '#services/media.mjs';

export const facility = {
  add: async (req, res, next) => {
    try {
      const result = await mediaService.facility.add(req);
      res.status(201).json({
        message: `${result.length} foto berhasil ditambahkan.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {},

  update: async (req, res, next) => {},

  dropAll: async (req, res, next) => {},

  dropOne: async (req, res, next) => {},
};
