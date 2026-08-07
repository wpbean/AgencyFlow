import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), "data", "app.db");
const BACKUP_DIR = path.join(process.cwd(), "backups");

if (!fs.existsSync(DB_PATH)) {
  console.error(`No database found at ${DB_PATH}`);
  process.exit(1);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const stamp = new Date()
  .toISOString()
  .replace(/[:T]/g, "-")
  .replace(/\..+/, "");
const dest = path.join(BACKUP_DIR, `app-${stamp}.db`);

fs.copyFileSync(DB_PATH, dest);
console.log(`Backup created: ${dest}`);

// Keep only the 30 most recent backups.
const files = fs
  .readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith("app-") && f.endsWith(".db"))
  .sort();
const excess = files.length - 30;
if (excess > 0) {
  for (const f of files.slice(0, excess)) {
    fs.unlinkSync(path.join(BACKUP_DIR, f));
  }
}
