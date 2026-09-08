import path from "path";

/** Use DATA_DIR=/data with a Railway volume so accounts survive deploys. */
export function getDataDir(): string {
  return process.env.DATA_DIR || path.join(process.cwd(), "data");
}

export function getUsersPath(): string {
  return path.join(getDataDir(), "users.json");
}

export function getStorePath(): string {
  return path.join(getDataDir(), "store.json");
}

export function getReportsRoot(): string {
  return path.join(getDataDir(), "reports");
}
