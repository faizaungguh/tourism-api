import { authService } from '#services/auth.mjs';

export const auth = {
  register: async (req, res) => {
    const result = await authService.registerManager(req.body);
    res.status(201).json({
      message: 'Manager berhasil dibuat',
      data: result,
    });
  },

  signin: async (req, res) => {
    const result = await authService.signIn(req.body);
    res.status(200).json({
      message: 'Anda berhasil login',
      data: result,
    });
  },

  signout: async (req, res, next) => {
    await authService.signOut(req.admin);
    res.status(200).json({ message: 'Berhasil logout' });
  },
};
