import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",

  // Sequelize and its dialect drivers need to be treated as external packages
  // because they use dynamic requires that Turbopack/webpack can't resolve
  serverExternalPackages: [
    "sequelize",
    "mysql2",
    "pg",
    "pg-hstore",
    "tedious",
    "sqlite3",
    "better-sqlite3",
    "oracledb",
    "ibm_db",
    "mariadb",
    "snowflake-sdk",
  ],
};

export default nextConfig;
