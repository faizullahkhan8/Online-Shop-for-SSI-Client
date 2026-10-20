export function securityConfigIssues(env) {
    const issues = [];
    for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
        if (typeof env[name] !== "string" || env[name].length < 32 || /test|example|changeme|placeholder/i.test(env[name])) issues.push(`${name}: use a unique random secret of at least 32 characters`);
    }
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) issues.push("Access and refresh secrets must differ");
    if (Buffer.byteLength(env.ENCRYPTION_KEY || "") !== 32 || /test|example|changeme|placeholder/i.test(env.ENCRYPTION_KEY || "")) issues.push("ENCRYPTION_KEY must contain exactly 32 random bytes");
    try { const url = new URL(env.FRONTEND_URL); if (url.protocol !== "https:" || url.origin !== env.FRONTEND_URL) throw new Error(); }
    catch { issues.push("FRONTEND_URL must be an HTTPS origin for production"); }
    if (!env.MONGO_URI_ONLINE) issues.push("MONGO_URI_ONLINE is required");
    return issues;
}
