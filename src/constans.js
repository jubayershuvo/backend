import dotenv from 'dotenv';
dotenv.config();


export const port = process.env.PORT || 8080;
export const cors_origin = process.env.CORS_ORIGIN || '*';
export const DB_URL = process.env.MONGO_DB_URL;
export const DB_NAME = 'videoTube';
export const access_token_secret_key = process.env.ACCESS_TOKEN_SECRET_KEY || "shuvo";
export const access_token_expiry = process.env.ACCESS_TOKEN_EXPIRY || "1d";
export const refresh_token_access_key = process.env.REFRESH_TOKEN_SECRET_KEY || "shuvo";
export const refresh_token_expiry = process.env.REFRESH_TOKEN_EXPIRY || "10d";