import "dotenv/config";
import mongoose from "mongoose";
import { readFile, writeFile } from "node:fs/promises";
import { createBackup, restoreBackup } from "../utils/databaseBackup.js";

const [mode, file, database] = process.argv.slice(2);
let connection;
try {
    if (!["backup", "restore"].includes(mode) || !file || !database || !/^[a-zA-Z0-9_-]+$/.test(database))
        throw new Error("Usage: node scripts/database-backup.mjs backup|restore FILE DATABASE");
    if (mode === "restore" && !database.startsWith("restore_")) throw new Error("Restore database name must start with restore_");
    const uri = mode === "restore" ? process.env.RESTORE_MONGO_URI : process.env.MONGO_URI_ONLINE;
    if (!uri) throw new Error("Required database URI is missing");
    connection = await mongoose.createConnection(uri, { dbName: database }).asPromise();
    if (mode === "backup") {
        await writeFile(file, await createBackup(connection, process.env.BACKUP_KEY), { flag: "wx", mode: 0o600 });
        console.log("Encrypted backup saved; existing files are never overwritten.");
    } else {
        const count = await restoreBackup(connection, await readFile(file), process.env.BACKUP_KEY);
        console.log(`Restored ${count} documents into the dedicated restore database.`);
    }
} catch {
    console.error("Backup/restore failed. Check arguments, key, database connectivity and empty restore target. No credentials are logged.");
    process.exitCode = 1;
} finally { await connection?.close(); }
