import { promises as fs } from "fs";
import path from "path";
import type { WeeklyReport } from "./types";
import { mondayOf, uid } from "./utils";

const REPORTS_ROOT = path.join(process.cwd(), "data", "reports");
const CURRENT_DIR = path.join(REPORTS_ROOT, "current");
const ARCHIVE_DIR = path.join(REPORTS_ROOT, "archive");

function weekFolderName(weekOf: string): string {
  return `week-of-${weekOf}`;
}

function parseWeekFromFolder(name: string): string | null {
  const match = /^week-of-(\d{4}-\d{2}-\d{2})$/.exec(name);
  return match?.[1] ?? null;
}

function safeAuthorSlug(authorName: string, username?: string): string {
  const base = (username || authorName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "leader";
}

async function ensureDirs(): Promise<void> {
  await fs.mkdir(CURRENT_DIR, { recursive: true });
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
}

async function readJsonFile(filePath: string): Promise<WeeklyReport | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as WeeklyReport;
  } catch {
    return null;
  }
}

async function listWeekDirs(root: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && parseWeekFromFolder(e.name))
      .map((e) => e.name)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

async function readReportsInWeekDir(dir: string): Promise<WeeklyReport[]> {
  try {
    const files = await fs.readdir(dir);
    const reports: WeeklyReport[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const report = await readJsonFile(path.join(dir, file));
      if (report) reports.push(report);
    }
    return reports.sort((a, b) => a.authorName.localeCompare(b.authorName));
  } catch {
    return [];
  }
}

/** Move finished weeks out of current/ into archive/. */
export async function archiveOldWeeks(): Promise<void> {
  await ensureDirs();
  const currentMonday = mondayOf();
  const weekDirs = await listWeekDirs(CURRENT_DIR);

  for (const folder of weekDirs) {
    const weekOf = parseWeekFromFolder(folder);
    if (!weekOf || weekOf >= currentMonday) continue;

    const from = path.join(CURRENT_DIR, folder);
    const to = path.join(ARCHIVE_DIR, folder);
    await fs.mkdir(path.dirname(to), { recursive: true });

    try {
      await fs.access(to);
      // Merge if archive week already exists
      const files = await fs.readdir(from);
      for (const file of files) {
        await fs.rename(path.join(from, file), path.join(to, file)).catch(async () => {
          // overwrite on conflict
          await fs.copyFile(path.join(from, file), path.join(to, file));
          await fs.unlink(path.join(from, file));
        });
      }
      await fs.rmdir(from).catch(() => undefined);
    } catch {
      await fs.rename(from, to);
    }
  }
}

export async function listCurrentReports(): Promise<WeeklyReport[]> {
  await archiveOldWeeks();
  const weekDirs = await listWeekDirs(CURRENT_DIR);
  const reports: WeeklyReport[] = [];
  for (const folder of weekDirs) {
    reports.push(...(await readReportsInWeekDir(path.join(CURRENT_DIR, folder))));
  }
  return reports.sort(
    (a, b) =>
      b.weekOf.localeCompare(a.weekOf) || a.authorName.localeCompare(b.authorName),
  );
}

export async function listArchiveWeeks(): Promise<
  { weekOf: string; folder: string; count: number }[]
> {
  await archiveOldWeeks();
  const weekDirs = await listWeekDirs(ARCHIVE_DIR);
  const weeks: { weekOf: string; folder: string; count: number }[] = [];

  for (const folder of weekDirs) {
    const weekOf = parseWeekFromFolder(folder);
    if (!weekOf) continue;
    const reports = await readReportsInWeekDir(path.join(ARCHIVE_DIR, folder));
    weeks.push({ weekOf, folder, count: reports.length });
  }

  return weeks;
}

export async function listArchiveReports(weekOf: string): Promise<WeeklyReport[]> {
  await archiveOldWeeks();
  const folder = weekFolderName(weekOf);
  return readReportsInWeekDir(path.join(ARCHIVE_DIR, folder));
}

export async function saveReport(input: {
  username: string;
  authorName: string;
  weekOf: string;
  wins: string;
  blockers: string;
  nextWeek: string;
  hoursSpent: number;
}): Promise<WeeklyReport> {
  await archiveOldWeeks();

  const weekOf = mondayOf(input.weekOf);
  const currentMonday = mondayOf();
  const bucketRoot = weekOf < currentMonday ? ARCHIVE_DIR : CURRENT_DIR;
  const weekDir = path.join(bucketRoot, weekFolderName(weekOf));
  await fs.mkdir(weekDir, { recursive: true });

  const slug = safeAuthorSlug(input.authorName, input.username);
  const filePath = path.join(weekDir, `${slug}.json`);

  let id = uid();
  const existing = await readJsonFile(filePath);
  if (existing?.id) id = existing.id;

  const report: WeeklyReport = {
    id,
    authorName: input.authorName,
    username: input.username,
    weekOf,
    wins: input.wins,
    blockers: input.blockers,
    nextWeek: input.nextWeek,
    hoursSpent: input.hoursSpent,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(filePath, JSON.stringify(report, null, 2));
  return report;
}

export async function countCurrentWeekReports(): Promise<number> {
  const week = mondayOf();
  const reports = await listCurrentReports();
  return reports.filter((r) => r.weekOf === week).length;
}
