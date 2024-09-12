import dotenv from 'dotenv';
dotenv.config();


export const port = process.env.PORT || 8080;
export const cors_origin = process.env.CORS_ORIGIN || '*';
export const DB_URL = process.env.MONGO_DB_URL;
export const DB_NAME = 'videoTube';
export const access_token_secret_key = process.env.ACCESS_TOKEN_SECRET_KEY || "shuvo";
export const access_token_expiry = process.env.ACCESS_TOKEN_EXPIRY || "1d";
export const refresh_token_secret_key = process.env.REFRESH_TOKEN_SECRET_KEY || "shuvo";
export const refresh_token_expiry = process.env.REFRESH_TOKEN_EXPIRY || "10d";
export const cloudinary_api_key = process.env.CLOUDINARY_API_KEY;
export const cloudinary_api_secret_key = process.env.CLOUDINARY_API_SECRET_KEY;
export const cloudinary_name = process.env.CLOUDINARY_NAME;
export const smtp_username = process.env.SMTP_USERNAME;
export const smtp_password = process.env.SMTP_PASSWORD;