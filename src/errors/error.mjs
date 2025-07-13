import { ResponseError } from '#errors/responseError.mjs';
import { logger } from '#app/logging.mjs';

export const method = (router) => (req, res, next) => {
  /** mencari cek rute endpoint */
  const match = router.stack.find(
    (layer) => layer.route && layer.route.path === req.path
  );

  /** jika path ditemukan tetapi metodenya tidak cocok */
  if (match && !match.route.methods[req.method.toLowerCase()]) {
    const allowedMethods = Object.keys(match.route.methods)
      .filter((method) => method !== '_all')
      .map((method) => method.toUpperCase())
      .join(', ');

    res.set('Allow', allowedMethods);
    return next(
      new ResponseError(
        405,
        `Metode ${req.method} tidak diizinkan untuk path ${req.path}. Metode yang diizinkan: ${allowedMethods}`
      )
    );
  }

  /** jika tidak ada masalah, lanjutkan */
  return next();
};

/** jika endpoint dipanggil tapi tidak terdaftar */
export const notFoundEndpoint = (req, res, next) => {
  next(
    new ResponseError(
      404,
      `Maaf, Endpoint untuk ${req.method} ${req.path} tidak ditemukan. Pastikan URL sudah benar.`
    )
  );
};

/** menampilkan pesan error */
export const error = (err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  if (err instanceof ResponseError) {
    logger.warn(`Error pada Klien ${err.status}: ${err.message}`);
    res.status(err.status).json({
      message: err.message,
      /** error 4xx adalah ketika kesalahan ada pada sisi klien */
      ...(Object.keys(err.errors).length > 0 && { errors: err.errors }),
    });
  } else {
    /** error 5xx adalah ketika kesalahan ada pada server */
    logger.error('Error pada Server:', err);
    res.status(500).json({
      message: 'Maaf, terjadi kesalahan pada server kami.',
    });
  }
};
