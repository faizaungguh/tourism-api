export const recommendationHelper = {
  show: {
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // * Jari-jari Bumi

      /**
       * * 1. Konversi Satuan Derajat ke Radian
       */
      const dLat = (lat2 - lat1) * (Math.PI / 180); // * hitung latitude
      const dLon = (lon2 - lon1) * (Math.PI / 180); // * hitung lon

      /**
       * * 2. Perhitungan nilai a (setengah tali busur lingkaran)
       */
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);

      /**
       * * 3. Perhitungan nilai c (jarak sudut dalam radian)
       */
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      /**
       * * 4. Perhitungan Jarak Akhir (d)
       */
      return R * c;
    },

    calculateTopsis(alternatives, weights, criteriaTypes) {
      console.log('--- MEMULAI PERHITUNGAN TOPSIS ---');
      console.log(
        'Alternatif yang diterima:',
        alternatives.map((a) => a.destinationTitle).join(', '),
      );
      console.log('Bobot (Weights):', weights);

      const criteriaKeys = Object.keys(weights).filter((key) => weights[key] > 0);
      console.log('Tidak ada kriteria atau alternatif yang valid. Mengembalikan skor 0.');
      if (criteriaKeys.length === 0 || alternatives.length === 0) {
        return alternatives.map((alt) => ({ ...alt, score: 0 }));
      }

      /**
       * * 1. Membuat Matriks Keputusan Ternormalisasi
       */
      const matrix = alternatives.map((alt) => criteriaKeys.map((key) => alt.criteria[key]));

      const dividers = criteriaKeys.map((_, j) =>
        Math.sqrt(matrix.reduce((sum, _, i) => sum + Math.pow(matrix[i][j], 2), 0)),
      );

      const normalizedMatrix = matrix.map((row) =>
        row.map((val, j) => (dividers[j] === 0 ? 0 : val / dividers[j])),
      );
      console.log('\n--- Langkah 1: Matriks Normalisasi (R) ---');
      const normalizedMatrixDisplay = normalizedMatrix.map((row, i) => {
        const obj = { 'Nama Destinasi': alternatives[i].destinationTitle };
        criteriaKeys.forEach((key, j) => {
          obj[key] = row[j];
        });
        return obj;
      });
      console.table(normalizedMatrixDisplay);

      /**
       * * 2. Membuat Matriks Keputusan Ternormalisasi Terbobot
       */
      const weightedMatrix = normalizedMatrix.map((row) =>
        row.map((val, j) => val * weights[criteriaKeys[j]]),
      );
      console.log('\n--- Langkah 2: Matriks Normalisasi Terbobot (Y) ---');
      const weightedMatrixDisplay = weightedMatrix.map((row, i) => {
        const obj = { 'Nama Destinasi': alternatives[i].destinationTitle };
        criteriaKeys.forEach((key, j) => {
          obj[key] = row[j];
        });
        return obj;
      });
      console.table(weightedMatrixDisplay);

      /**
       * * 3. Menentukan Solusi Ideal Positif dan Negatif
       */
      const idealPositive = criteriaKeys.map((key, j) => {
        const column = weightedMatrix.map((row) => row[j]);
        return criteriaTypes[key] === 'benefit' ? Math.max(...column) : Math.min(...column);
      });
      console.log('\n--- Langkah 4: Solusi Ideal ---');
      console.log('Solusi Ideal Positif (A+):', idealPositive);

      const idealNegative = criteriaKeys.map((key, j) => {
        const column = weightedMatrix.map((row) => row[j]);
        return criteriaTypes[key] === 'benefit' ? Math.min(...column) : Math.max(...column);
      });
      console.log('Solusi Ideal Negatif (A-):', idealNegative);

      /**
       * * 4. Menghitung Jarak Solusi Positif dan Negatif
       */
      const distances = weightedMatrix.map((row) => {
        const dPositive = Math.sqrt(
          // * Jarak Solusi Positif
          row.reduce((sum, val, j) => sum + Math.pow(val - idealPositive[j], 2), 0),
        );
        const dNegative = Math.sqrt(
          // * Jarak Solusi Negatif
          row.reduce((sum, val, j) => sum + Math.pow(val - idealNegative[j], 2), 0),
        );
        return { dPositive, dNegative };
      });
      console.log('\n--- Langkah 4: Jarak ke Solusi Ideal (D+ & D-) ---');
      const distancesDisplay = distances.map((d, i) => ({
        'Nama Destinasi': alternatives[i].destinationTitle,
        ...d,
      }));
      console.table(distancesDisplay);
      /**
       * *  5. Menghitung Nilai Preferensi
       */
      console.log('\n--- Langkah 5: Menghitung Nilai Preferensi (V) ---');
      const rankedAlternatives = alternatives.map((alt, i) => {
        const { dPositive, dNegative } = distances[i];
        const score = dNegative + dPositive === 0 ? 0 : dNegative / (dNegative + dPositive);
        return {
          ...alt,
          score: parseFloat(score.toFixed(5)),
        };
      });

      rankedAlternatives.sort((a, b) => b.score - a.score);

      const tableData = rankedAlternatives.map((alt, index) => ({
        Ranking: index + 1,
        'Nama Destinasi': alt.destinationTitle,
        'Nilai Alternatif': alt.score,
      }));
      console.table(tableData);

      console.log('\n--- PERHITUNGAN TOPSIS SELESAI ---');
      return rankedAlternatives;
    },
  },
};
