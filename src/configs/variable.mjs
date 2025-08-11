import 'dotenv/config';

export const config = {
  NODE_ENV: process.env.ENV,
  APP_URL: process.env.APP_URL,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  MONGO_IP: process.env.MONGO_IP || 'localhost',
  MONGO_PORT: process.env.MONGO_PORT || 27017,
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
  MONGO_DB: process.env.MONGO_DB || 'tourismDb',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
};
