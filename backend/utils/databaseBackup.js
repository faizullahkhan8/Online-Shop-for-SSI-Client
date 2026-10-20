import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import mongoose from "mongoose";

const { EJSON } = mongoose.mongo.BSON;
const MAX_BYTES = 100 * 1024 * 1024;
function keyBytes(key) {
    if (!/^[a-f\d]{64}$/i.test(key || "")) throw new Error("BACKUP_KEY must be 64 hex characters");
    return Buffer.from(key, "hex");
}

export async function createBackup(connection, key) {
    const encryptionKey = keyBytes(key);
    const collections = await connection.db.listCollections({}, { nameOnly: true }).toArray();
    const snapshot = { version: 1, createdAt: new Date(), collections: [] };
    const session = await connection.startSession();
    try {
        await session.withTransaction(async () => {
            snapshot.collections = [];
            let size = 0;
            for (const { name } of collections) {
                if (name.startsWith("system.")) continue;
                const collection = connection.db.collection(name);
                const documents = [];
                for await (const document of collection.find({}, { session })) {
                    size += Buffer.byteLength(EJSON.stringify(document, { relaxed: false }));
                    if (size > MAX_BYTES) throw new Error("Snapshot exceeds 100 MB; use managed database backups");
                    documents.push(document);
                }
                snapshot.collections.push({ name, documents, indexes: await collection.indexes() });
            }
        }, { readConcern: { level: "snapshot" } });
    } finally { await session.endSession(); }
    const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(EJSON.stringify(snapshot, { relaxed: false })), cipher.final()]);
    return Buffer.concat([Buffer.from("SSI1"), iv, cipher.getAuthTag(), encrypted]);
}

export async function restoreBackup(connection, bytes, key) {
    if (bytes.length > MAX_BYTES + 1024 * 1024 || bytes.subarray(0, 4).toString() !== "SSI1") throw new Error("Invalid backup");
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(key), bytes.subarray(4, 16));
    decipher.setAuthTag(bytes.subarray(16, 32));
    const snapshot = EJSON.parse(Buffer.concat([decipher.update(bytes.subarray(32)), decipher.final()]).toString(), { relaxed: false });
    if (Number(snapshot.version) !== 1 || !Array.isArray(snapshot.collections)) throw new Error("Unsupported backup");
    if ((await connection.db.listCollections({}, { nameOnly: true }).toArray()).length)
        throw new Error("Restore requires an empty dedicated database; existing data is never overwritten");
    for (const { name, documents, indexes } of snapshot.collections) {
        await connection.db.createCollection(name);
        const collection = connection.db.collection(name);
        for (const index of indexes) {
            if (index.name === "_id_") continue;
            const { key: indexKey, v, ns, ...options } = index;
            await collection.createIndex(indexKey, options);
        }
        if (documents.length) await collection.insertMany(documents);
    }
    return snapshot.collections.reduce((sum, collection) => sum + collection.documents.length, 0);
}
