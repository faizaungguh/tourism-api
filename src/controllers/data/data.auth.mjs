import { dataService } from '#services/data/index.mjs';

export const auth = {
  register: async (req, res) => {
    const result = await dataService.auth.register(req.body);
    res.status(201).json({
      message: 'Manager berhasil dibuat',
      data: result,
    });
  },

  signin: async (req, res) => {
    const result = await dataService.auth.signIn(req.body);
    const { token, user } = result;

    res.cookie('accessToken', token, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600 * 1000,
      path: '/',
    });

    res.status(200).json({
      message: 'Anda berhasil login',
      data: user,
    });
  },

  signout: async (req, res) => {
    res.clearCookie('accessToken', { path: '/' });
    res.status(200).json({ message: 'Berhasil logout' });
  },
};
