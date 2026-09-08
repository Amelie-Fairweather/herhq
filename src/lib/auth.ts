import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { cookies } from "next/headers";

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");

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
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_PATH);
  } catch {
    const empty: UsersFile = { users: [] };
    await fs.writeFile(USERS_PATH, JSON.stringify(empty, null, 2));
  }
}

export async function readUsers(): Promise<UserRecord[]> {
  await ensureUsersFile();
  const raw = await fs.readFile(USERS_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw) as UsersFile;
    return parsed.users ?? [];
  } catch {
    return [];
  }
}

async function writeUsers(users: UserRecord[]): Promise<void> {
  await ensureUsersFile();
  await fs.writeFile(USERS_PATH, JSON.stringify({ users }, null, 2));
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/\s+/g, "");
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

export async function findUser(username: string): Promise<UserRecord | null> {
  const users = await readUsers();
  return users.find((u) => u.username === normalizeUsername(username)) ?? null;
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

export async function authenticateUser(
  username: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await findUser(username);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
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
