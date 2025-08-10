export const recommendationHelper = {
  show: {
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    calculateTopsis(alternatives, weights, criteriaTypes) {
      console.log('--- MEMULAI PERHITUNGAN TOPSIS ---');
      console.log(
        'Alternatif yang diterima:',
        alternatives.map((a) => a.destinationTitle).join(', ')
      );
      console.log('Bobot (Weights):', weights);

      const criteriaKeys = Object.keys(weights).filter((key) => weights[key] > 0);
      if (criteriaKeys.length === 0 || alternatives.length === 0) {
        console.log('Tidak ada kriteria atau alternatif yang valid. Mengembalikan skor 0.');
        return alternatives.map((alt) => ({ ...alt, score: 0 }));
      }

      const matrix = alternatives.map((alt) => criteriaKeys.map((key) => alt.criteria[key]));

      const dividers = criteriaKeys.map((_, j) =>
        Math.sqrt(matrix.reduce((sum, _, i) => sum + Math.pow(matrix[i][j], 2), 0))
      );

      const normalizedMatrix = matrix.map((row) =>
        row.map((val, j) => (dividers[j] === 0 ? 0 : val / dividers[j]))
      );
      console.log('\n--- Langkah 2: Matriks Normalisasi (R) ---');
      console.table(normalizedMatrix);

      const weightedMatrix = normalizedMatrix.map((row) =>
        row.map((val, j) => val * weights[criteriaKeys[j]])
      );
      console.log('\n--- Langkah 3: Matriks Normalisasi Terbobot (Y) ---');
      console.table(weightedMatrix);

      const idealPositive = criteriaKeys.map((key, j) => {
        const column = weightedMatrix.map((row) => row[j]);
        return criteriaTypes[key] === 'benefit' ? Math.max(...column) : Math.min(...column);
      });

      const idealNegative = criteriaKeys.map((key, j) => {
        const column = weightedMatrix.map((row) => row[j]);
        return criteriaTypes[key] === 'benefit' ? Math.min(...column) : Math.max(...column);
      });
      console.log('\n--- Langkah 4: Solusi Ideal ---');
      console.log('Solusi Ideal Positif (A+):', idealPositive);
      console.log('Solusi Ideal Negatif (A-):', idealNegative);

      const distances = weightedMatrix.map((row) => {
        const dPositive = Math.sqrt(
          row.reduce((sum, val, j) => sum + Math.pow(val - idealPositive[j], 2), 0)
        );
        const dNegative = Math.sqrt(
          row.reduce((sum, val, j) => sum + Math.pow(val - idealNegative[j], 2), 0)
        );
        return { dPositive, dNegative };
      });
      console.log('\n--- Langkah 5: Jarak ke Solusi Ideal (D+ & D-) ---');
      console.table(distances);

      console.log('\n--- Langkah 6: Menghitung Nilai Preferensi (V) ---');
      const rankedAlternatives = alternatives.map((alt, i) => {
        const { dPositive, dNegative } = distances[i];
        const score = dNegative + dPositive === 0 ? 0 : dNegative / (dNegative + dPositive);
        console.log(`Skor untuk "${alt.destinationTitle}": ${score.toFixed(5)}`);
        return {
          ...alt,
          score: parseFloat(score.toFixed(5)),
        };
      });

      console.log('\n--- PERHITUNGAN TOPSIS SELESAI ---');
      return rankedAlternatives.sort((a, b) => b.score - a.score);
    },
  },
};
