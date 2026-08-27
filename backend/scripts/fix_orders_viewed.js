import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI_LOCAL).then(async () => {
    console.log("Connected to MongoDB.");
    const orderSchema = new mongoose.Schema({}, { strict: false });
    const Order = mongoose.model('Order', orderSchema);
    
    const result = await Order.updateMany(
        { isViewed: { $exists: false } },
        { $set: { isViewed: true } }
    );
    
    console.log(`Updated ${result.modifiedCount} orders to be viewed.`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
