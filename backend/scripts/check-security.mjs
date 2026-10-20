import "dotenv/config";
import { securityConfigIssues } from "../utils/securityConfig.js";
const issues = securityConfigIssues(process.env);
console.log(issues.length ? issues.join("\n") : "Security configuration checks passed.");
process.exitCode = issues.length ? 1 : 0;
