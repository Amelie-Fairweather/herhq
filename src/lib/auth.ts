import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import { cookies } from "next/headers";
import { getDataDir, getUsersPath } from "./paths";

const SESSION_COOKIE = "her_hq_session";
const USER_COOKIE = "her_hq_user";
const NAME_COOKIE = "her_hq_name";

export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
};

type UsersFile = { users: UserRecord[] };

export type Session = {
  username: string;
  name: string;
};

export function getIngestSecret(): string {
  return process.env.INGEST_SECRET || "her-form-secret";
}

function hashPassword(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, 64);
}

export function createPasswordHash(password: string): string {
  const salt = randomBytes(16);
  const hash = hashPassword(password, salt);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = hashPassword(password, salt);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

async function ensureUsersFile(): Promise<void> {
  await fs.mkdir(getDataDir(), { recursive: true });
  try {
    await fs.access(getUsersPath());
  } catch {
    const empty: UsersFile = { users: [] };
    await fs.writeFile(getUsersPath(), JSON.stringify(empty, null, 2));
  }
}

export async function readUsers(): Promise<UserRecord[]> {
  await ensureUsersFile();
  const raw = await fs.readFile(getUsersPath(), "utf8");
  try {
    const parsed = JSON.parse(raw) as UsersFile;
    return parsed.users ?? [];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  await ensureUsersFile();
  await fs.writeFile(getUsersPath(), JSON.stringify({ users }, null, 2));
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

export async function findUser(username: string): Promise<UserRecord | null> {
  await ensureBootstrapUser();
  const users = await readUsers();
  return users.find((u) => u.username === normalizeUsername(username)) ?? null;
}

/** Create bootstrap admin from env if the users file is empty. */
export async function ensureBootstrapUser(): Promise<void> {
  const username = process.env.BOOTSTRAP_USERNAME?.trim();
  const password = process.env.BOOTSTRAP_PASSWORD?.trim();
  const displayName =
    process.env.BOOTSTRAP_DISPLAY_NAME?.trim() || username || "Admin";
  if (!username || !password) return;

  const users = await readUsers();
  const existing = users.find((u) => u.username === normalizeUsername(username));
  if (existing) return;

  await createUser({ username, displayName, password });
}

export async function createUser(input: {
  username: string;
  displayName: string;
  password: string;
}): Promise<{ user?: UserRecord; error?: string }> {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  const password = input.password;

  if (!isValidUsername(username)) {
    return {
      error:
        "Username must be 3–32 characters: letters, numbers, dots, dashes, or underscores.",
    };
  }
  if (!displayName) {
    return { error: "Display name is required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const users = await readUsers();
  if (users.some((u) => u.username === username)) {
    return { error: "That username is already taken." };
  }

  const user: UserRecord = {
    id: createHash("sha256")
      .update(`${username}-${Date.now()}-${Math.random()}`)
      .digest("hex")
      .slice(0, 16),
    username,
    displayName,
    passwordHash: createPasswordHash(password),
    createdAt: new Date().toISOString(),
  };

  await writeUsers([...users, user]);
  return { user };
}

export async function setUserPassword(
  username: string,
  password: string,
  displayName?: string,
): Promise<{ user?: UserRecord; error?: string }> {
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const normalized = normalizeUsername(username);
  const users = await readUsers();
  const idx = users.findIndex((u) => u.username === normalized);

  if (idx === -1) {
    return createUser({
      username: normalized,
      displayName: displayName?.trim() || normalized,
      password,
    });
  }

  const next = [...users];
  next[idx] = {
    ...next[idx],
    passwordHash: createPasswordHash(password),
    displayName: displayName?.trim() || next[idx].displayName,
  };
  await writeUsers(next);
  return { user: next[idx] };
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<{ user: UserRecord | null; reason?: "missing" | "bad_password" }> {
  await ensureBootstrapUser();
  const user = await findUser(username);
  if (!user) return { user: null, reason: "missing" };
  if (!verifyPassword(password, user.passwordHash)) {
    return { user: null, reason: "bad_password" };
  }
  return { user };
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const username = jar.get(USER_COOKIE)?.value;
  if (token !== "ok" || !username) return null;

  const user = await findUser(username);
  if (!user) return null;

  return { username: user.username, name: user.displayName };
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export { SESSION_COOKIE, USER_COOKIE, NAME_COOKIE };
