import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },

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
