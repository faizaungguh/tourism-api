import * as destinationService from '#services/destination.mjs';

export const post = async (req, res) => {
  const result = await destinationService.createDestination(req.body);
  res.status(201).json({
    message: 'Tempat Wisata baru berhasil ditambahkan',
    data: result,
  });
};

export const get = async (req, res) => {};

export const patch = async (req, res) => {};

export const drop = async (req, res) => {};
