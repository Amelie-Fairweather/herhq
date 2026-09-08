import { promises as fs } from "fs";
import path from "path";
import type { Store } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const emptyStore = (): Store => ({
  events: [],
  applications: [],
  bids: [],
});

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify(emptyStore(), null, 2));
  }
}

export async function readStore(): Promise<Store> {
  await ensureStore();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as Store;
    return {
      events: parsed.events ?? [],
      applications: parsed.applications ?? [],
      bids: parsed.bids ?? [],
    };
  } catch {
    return emptyStore();
  }
}

export async function writeStore(store: Store): Promise<void> {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function updateStore(
  updater: (store: Store) => Store | Promise<Store>,
): Promise<Store> {
  const current = await readStore();
  const next = await updater(current);
  await writeStore(next);
  return next;
}
