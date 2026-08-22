import mongoose from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017/medicare").then(async () => {
    try {
        const db = mongoose.connection.db;
        const result = await db.collection("products").updateMany(
            { vendor: { $type: "string" } },
            { $unset: { vendor: "" } }
        );
        console.log(`Cleared vendor strings from ${result.modifiedCount} products.`);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
});
