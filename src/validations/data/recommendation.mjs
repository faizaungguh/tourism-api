import validate from 'joi';

const checkWeightSum = (value, helpers) => {
  const weights = [
    value.weight_distance,
    value.weight_attractions,
    value.weight_facilities,
    value.weight_ticketPrice,
    value.weight_parkingCapacity,
  ];

  const totalWeight = weights.reduce((sum, current) => sum + (current || 0), 0);

  if (totalWeight !== 100) {
    const error = helpers.error('any.custom', {
      message: `Total semua bobot (weight) harus tepat 100. Total saat ini adalah ${totalWeight}.`,
    });
    error.path = ['weight'];
    return error;
  }

  return value;
};

export const recommendationChecker = {
  isValid: validate
    .object({
      category: validate
        .alternatives()
        .try(validate.string(), validate.array().items(validate.string()))
        .messages({
          'alternatives.types': 'Kategori harus berupa teks atau kumpulan teks.',
        }),

      lat: validate.number().min(-90).max(90),
      long: validate.number().min(-180).max(180),

      weight_distance: validate.number().min(0).max(100).default(0),
      weight_attractions: validate.number().min(0).max(100).default(0),
      weight_facilities: validate.number().min(0).max(100).default(0),
      weight_ticketPrice: validate.number().min(0).max(100).default(0),
      weight_parkingCapacity: validate.number().min(0).max(100).default(0),

      limit: validate.number().integer().min(1).max(20).default(10),
      fields: validate.string(),
    })
    .custom(checkWeightSum, 'Validasi nilai bobot')
    .with('lat', 'long')
    .messages({
      'number.base': 'Nilai untuk {#label} harus berupa angka.',
      'number.min': 'Nilai untuk {#label} tidak boleh kurang dari {#limit}.',
      'number.max': 'Nilai untuk {#label} tidak boleh lebih dari {#limit}.',
      'number.integer': 'Nilai untuk {#label} harus berupa bilangan bulat.',
      'string.base': 'Nilai untuk {#label} harus berupa teks.',
      'object.with': 'Parameter {#peer} wajib ada jika {#label} diisi.',
      'any.custom': '{{#message}}',
    }),
};
