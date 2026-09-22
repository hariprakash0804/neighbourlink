/**
 * Dynamic Sequelize CLI Database Configuration
 * Loads credentials securely from environment variables instead of plaintext files.
 */

const dbHost = process.env.DB_HOST || "127.0.0.1";
const useSsl =
  process.env.DB_SSL === "true" ||
  dbHost.includes("tidbcloud.com") ||
  dbHost.includes("aivencloud.com") ||
  dbHost.includes("rds.amazonaws.com") ||
  dbHost.includes("neon.tech");

const dbConfig = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "neighborlink",
  host: dbHost,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  dialect: "mysql",
  dialectOptions: useSsl
    ? {
        ssl: {
          minVersion: "TLSv1.2",
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED === "false" ? false : true,
        },
      }
    : undefined,
};

module.exports = {
  development: dbConfig,
  test: {
    ...dbConfig,
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : "neighborlink_test",
  },
  production: dbConfig,
};
