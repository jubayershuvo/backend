import dotenv from 'dotenv';
dotenv.config();


export const port = process.env.PORT || 8080;
export const cors_origin = process.env.CORS_ORIGIN || '*';
export const DB_URL = process.env.MONGO_DB_URL;
export const DB_NAME = 'videoTube';