/**
 * Dynamic Sequelize CLI Database Configuration
 * Loads credentials securely from environment variables instead of plaintext files.
 */

const dbConfig = {
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "neighborlink",
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  dialect: "mysql",
  dialectOptions: process.env.DB_SSL === "true" ? {
    ssl: {
      rejectUnauthorized: true,
    }
  } : undefined,
};

module.exports = {
  development: dbConfig,
  test: {
    ...dbConfig,
    database: process.env.DB_NAME ? `${process.env.DB_NAME}_test` : "neighborlink_test",
  },
  production: dbConfig,
};
