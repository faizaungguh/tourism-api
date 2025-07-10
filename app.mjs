import { PORT } from './src/configs/variable.mjs';
import { web } from './src/app/web.mjs';
import connectionDB from './src/app/db.mjs';

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
