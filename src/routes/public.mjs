import express from 'express';

export const publicRouter = new express.Router();

publicRouter.get('/destination', (req, res) => {
  res.status(200).json({ data: 'Sukses mengakses destination' });
});
