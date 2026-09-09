import { promises as fs } from "fs";
import { withWeeklyHerCall } from "./calendar";
import type { Store } from "./types";
import { getDataDir, getStorePath } from "./paths";

const emptyStore = (): Store => ({
  events: [],
  applications: [],
  bids: [],
  ideas: [],
  ideaPledges: [],
});

async function ensureStore(): Promise<void> {
  await fs.mkdir(getDataDir(), { recursive: true });
  try {
    await fs.access(getStorePath());
  } catch {
    await fs.writeFile(getStorePath(), JSON.stringify(emptyStore(), null, 2));
  }
}

export async function readStore(): Promise<Store> {
  await ensureStore();
  const raw = await fs.readFile(getStorePath(), "utf8");
  try {
    const parsed = JSON.parse(raw) as Store;
    const events = withWeeklyHerCall(parsed.events ?? []);
    const store: Store = {
      events,
      applications: (parsed.applications ?? []).map((app) => ({
        ...app,
        meetingAvailability: app.meetingAvailability ?? "",
      })),
      bids: parsed.bids ?? [],
      ideas: parsed.ideas ?? [],
      ideaPledges: parsed.ideaPledges ?? [],
    };
    // Persist the seeded weekly call once so it survives and can be edited/removed.
    if (events.length !== (parsed.events ?? []).length) {
      await writeStore(store);
    }
    return store;
  } catch {
    const store = emptyStore();
    store.events = withWeeklyHerCall([]);
    await writeStore(store);
    return store;
  }
}

export async function writeStore(store: Store): Promise<void> {
  await ensureStore();
  await fs.writeFile(getStorePath(), JSON.stringify(store, null, 2));
}

export async function updateStore(
  updater: (store: Store) => Store | Promise<Store>,
): Promise<Store> {
  const current = await readStore();
  const next = await updater(current);
  await writeStore(next);
  return next;
}
