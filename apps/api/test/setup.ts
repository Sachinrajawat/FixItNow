// Jest globalSetup — runs before any test module is loaded.
// Quiets the pino logs and provides default JWT secrets so the env
// validation in src/config/env.ts passes without a real .env file.

process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.LOG_LEVEL = "silent";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ??
  "test_access_secret_change_me_change_me_please_now";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ??
  "test_refresh_secret_change_me_change_me_please_now";
