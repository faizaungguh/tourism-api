import { PORT } from '#configs/variable.mjs';
import { web } from '#app/web.mjs';
import connectionDB from '#app/db.mjs';

const startServer = async () => {
  try {
    await connectionDB();
    web.listen(PORT, () => {
      console.log(`Server berjalan pada http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
  }
};

startServer();
