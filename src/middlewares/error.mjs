import { ResponseError } from '#errors/responseError.mjs';
import { logger } from '#app/logging.mjs';

export const handler = {
  method: (router) => (req, res, next) => {
    const match = router.stack.find(
      (layer) => layer.route && layer.regexp && layer.regexp.test(req.path)
    );

    if (match && !match.route.methods[req.method.toLowerCase()]) {
      const allowedMethods = Object.keys(match.route.methods)
        .filter((method) => method !== '_all')
        .map((method) => method.toUpperCase())
        .join(', ');

      res.set('Allow', allowedMethods);
      return next(
        new ResponseError(
          405,
          `Metode ${req.method} tidak diizinkan untuk path ${req.path}.`
        )
      );
    }

    return next();
  },

  notFoundEndpoint: (req, res, next) => {
    next(
      new ResponseError(
        404,
        `Maaf, Endpoint untuk ${req.method} ${req.path} tidak ditemukan. Pastikan URL sudah benar.`
      )
    );
  },

  error: (err, req, res, next) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      logger.warn(
        `Error pada Klien 400: Gagal mem-parsing JSON body - ${err.message}`
      );
      return res.status(422).json({
        message: 'Data yang diberikan tidak valid',
        errors: {
          message:
            'Format JSON tidak valid. Mohon periksa kembali body request Anda.',
        },
      });
    }

    if (err instanceof ResponseError) {
      logger.warn(`Error pada Klien ${err.status}: ${err.message}`);
      res.status(err.status).json({
        message: err.message,
        ...(Object.keys(err.errors).length > 0 && { errors: err.errors }),
      });
    } else {
      logger.error('Error pada Server:', err);
      res.status(500).json({
        message: 'Maaf, terjadi kesalahan pada server kami.',
      });
    }
  },
};
