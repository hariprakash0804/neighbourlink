import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Security Headers configuration
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
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
