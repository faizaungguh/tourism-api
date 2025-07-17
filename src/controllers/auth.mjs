import { authService } from '#services/auth.mjs';

export const auth = {
  register: async (req, res) => {
    const result = await authService.registerManager(req.body);
    res.status(201).json({
      message: 'Manager berhasil dibuat',
      data: result,
    });
  },

  signin: async (req, res) => {},

  signout: async (req, res) => {},
};
