import 'dotenv/config';
import { web } from './src/app/web.mjs';
import connectionDB from './src/app/db.mjs';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectionDB();
    web.listen(PORT, () => {
      console.log(`Server berjalan pada http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();