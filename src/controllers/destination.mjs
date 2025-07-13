import * as destinationService from '#services/destination.mjs';

export const post = async (req, res) => {
  const result = await destinationService.createDestination(req.body);
  res.status(201).json({
    message: 'Tempat Wisata baru berhasil ditambahkan',
    data: result,
  });
};

export const get = async (req, res) => {
  if (req.query.id) {
    const id = req.query.id;
    const result = await destinationService.getDetailDestination(id);
    res.status(200).json({
      message: `Menampilkan Detail ${result.destinationTitle}`,
      data: result,
    });
  } else {
    const { result, pagination } = await destinationService.getAllDestination(
      req.query
    );

    const message =
      pagination.totalItems > 0
        ? 'Menampilkan List Data Destinasi'
        : 'Data tidak ditemukan';

    res.status(200).json({
      message,
      result,
      pagination,
    });
  }
};

export const slugCategory = async (req, res) => {
  const { categorySlug } = req.params;

  const query = {
    ...req.query,
    category: categorySlug,
  };

  const { result, pagination } = await destinationService.getAllDestination(
    query
  );

  const message =
    pagination.totalItems > 0
      ? `Menampilkan destinasi '${result[0].category}'`
      : `Tidak ditemukan kategori ${categorySlug}`;

  res.status(200).json({ message, result, pagination });
};

export const slug = async (req, res) => {
  const { categorySlug, destinationSlug } = req.params;
  const result = await destinationService.getDetailSlug(
    categorySlug,
    destinationSlug
  );
  res.status(200).json({
    message: `Menampilkan Detail Wisata dari ${result.destinationTitle}`,
    data: result,
  });
};

export const patch = async (req, res) => {};

export const drop = async (req, res) => {};
