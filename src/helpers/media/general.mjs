import { ResponseError } from '#errors/responseError.mjs';
import { Destination } from '#schemas/destination.mjs';

export const general = {
  checkIsOwner: {
    destination: async (req, res, next) => {
      try {
        const { destinations } = req.params;
        const { adminId } = req.admin;

        const destinationDoc = await Destination.findOne({ slug: destinations })
          .populate({
            path: 'createdBy',
            select: 'adminId',
          })
          .select('createdBy locations slug profilePhoto headlinePhoto galleryPhoto')
          .populate({ path: 'locations.subdistrict', select: 'abbrevation' });

        if (!destinationDoc) {
          throw new ResponseError(404, 'Destinasi tidak ditemukan', {
            message: `Destinasi dengan slug "${slug}" tidak ditemukan.`,
          });
        }

        if (!destinationDoc.createdBy) {
          throw new ResponseError(
            404,
            `Data admin untuk destinasi '${slug}' rusak atau tidak ditemukan.`
          );
        }

        if (destinationDoc.createdBy.adminId !== adminId) {
          throw new ResponseError(403, 'Akses ditolak', {
            message: 'Anda bukan pemilik atau pengelola destinasi ini.',
          });
        }

        req.foundDestination = destinationDoc;

        next();
      } catch (error) {
        next(error);
      }
    },
  },
};
