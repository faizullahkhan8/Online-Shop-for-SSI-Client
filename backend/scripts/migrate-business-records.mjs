import "dotenv/config";
import { connectToDB, getLocalOrderModel } from "../config/localDb.js";
import { migrateBusinessRecords } from "../services/businessMigration.js";
const args = process.argv.slice(2);
if (args.some(arg => !["--apply", "--dry-run"].includes(arg)) || (args.includes("--apply") && args.includes("--dry-run"))) throw new Error("Use --dry-run (default) or --apply");
try {
    await connectToDB();
    console.log(JSON.stringify(await migrateBusinessRecords({ apply: args.includes("--apply") })));
} catch {
    console.error("Business migration failed. Check connectivity and retry after resolving the failure. Existing records are not deleted.");
    process.exitCode = 1;
} finally { await getLocalOrderModel()?.db.close(); }
