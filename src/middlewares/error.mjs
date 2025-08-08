import { ResponseError } from '#errors/responseError.mjs';
import { logger } from '#app/logging.mjs';

export const handler = {
  method: (allowed = []) => {
    return (req, res, next) => {
      const allowedMethodsString = allowed.map((m) => m.toUpperCase()).join(', ');

      res.set('Allow', allowedMethodsString);

      next(
        new ResponseError(405, 'Method ini dilarang', {
          message: `Metode ${req.method} tidak diizinkan untuk mengakses ${req.path}.`,
        })
      );
    };
  },

  notFoundEndpoint: (req, res, next) => {
    next(
      new ResponseError(404, 'Url tidak terdaftar', {
        message: `Maaf, Endpoint untuk ${req.method} ${req.path} tidak ditemukan. Pastikan URL sudah benar.`,
      })
    );
  },

  error: (err, req, res, next) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      logger.warn(`Error pada Klien 422: Gagal mem-parsing JSON body - ${err.message}`);
      return res.status(422).json({
        message: 'Data anda tidak valid',
        errors: {
          message: 'Format JSON tidak valid. Mohon periksa kembali body request Anda.',
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
        message: 'Server tidak melayani',
        errors: { message: 'Maaf, terjadi kesalahan pada server kami.' },
      });
    }
  },
};
