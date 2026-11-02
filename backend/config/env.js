
const dotenv = require("dotenv");

dotenv.config();

const requiredEnv = (key) => {
  const value = process.env[key];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value.trim();
};

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number");
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: port,

  CLIENT_URL: requiredEnv("CLIENT_URL"),
  ADMIN_URL: requiredEnv("ADMIN_URL"),

  MONGODB_URI: requiredEnv("MONGODB_URI"),

  JWT_ACCESS_SECRET: requiredEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requiredEnv("JWT_REFRESH_SECRET"),

  UTTER_API_KEY: requiredEnv("UTTER_API_KEY"),
};

if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
  throw new Error("Access and refresh JWT secrets must be different");
}

module.exports = env;
