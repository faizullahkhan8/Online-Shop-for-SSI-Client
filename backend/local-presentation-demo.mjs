import { MongoMemoryReplSet } from 'mongodb-memory-server';
import crypto from 'node:crypto';
import * as db from './config/localDb.js';
const mongo = await MongoMemoryReplSet.create({replSet:{count:1,ip:'127.0.0.1'},binary:{version:'7.0.14'}});
process.env.MONGO_URI_ONLINE=mongo.getUri();
process.env.JWT_ACCESS_SECRET=crypto.randomBytes(32).toString('hex');
process.env.JWT_REFRESH_SECRET=crypto.randomBytes(32).toString('hex');
process.env.ENCRYPTION_KEY=crypto.randomBytes(16).toString('hex');
process.env.FRONTEND_URL='http://127.0.0.1:5173';
process.env.PORT='3000';
await db.connectToDB();
const admin=await db.getLocalUserModel().create({name:'Demo Administrator',email:'demo.admin@example.test',password:'LocalPresentation2026!',role:'admin',isPhoneVerified:true});
const customer=await db.getLocalUserModel().create({name:'Demo Customer',email:'demo.customer@example.test',password:'LocalPresentation2026!',role:'user',isPhoneVerified:true});
const cats=await db.getLocalCategoryModel().create([{name:'Medicines'},{name:'Personal Care'},{name:'Vitamins and Supplements'},{name:'First Aid'}]);
const vendor=await db.getLocalVendorModel().create({name:'Demo Supplier',description:'Sample supplier for the local presentation'});
const samples=[['Panadol Tablets 500mg',40,0],['Sensodyne Toothpaste 75ml',450,1],['CAC 1000 Plus Tablets',320,2],['Surbex Z Tablets',580,2],['Dettol Antiseptic Liquid',380,3],['First Aid Bandages',120,3],['Vitamin C Tablets',650,2],['Digital Thermometer',950,3]];
const products=await db.getLocalProductModel().create(samples.map(([name,price,c],i)=>({name,slug:'demo-product-'+i,price,category:cats[c]._id,vendor:vendor._id,stock:i===6?3:30+i*5,lowStock:5,sold:12+i*4,description:'Sample catalog entry for a local demonstration. Product information and prices are illustrative.',details:[{title:'Product information',contentHTML:'<p>Demonstration catalog item. Consult the product packaging and a pharmacist for actual product guidance.</p>'}],badges:i<2?['Popular']:[]})));
await db.getLocalSettingsModel().create({taxAmount:0,shippingFee:150,paymentMethods:[{title:'Cash on Delivery',information:'Pay upon delivery',isActive:true}],advancedShipping:{calculationMethod:'flat'}});
for(let i=0;i<12;i++){
 const product=products[i%products.length];
 await db.getLocalOrderModel().create({userId:customer._id,recipient:{name:'Demo Customer '+(i+1),street:'Sample delivery address',city:'Bannu',country:'Pakistan',phone:'00000000000'},items:[{product:product._id,quantity:2,price:product.price,totalAmount:product.price*2}],grandTotal:product.price*2+150,shippingFee:150,payment:{method:'Cash on Delivery',ispaid:i%3===0},status:['pending','shipped','delivered'][i%3],createdAt:new Date(Date.now()-i*86400000)});
}
await db.getLocalPromotionModel().create({title:'Demo Health Essentials Offer',type:'OFFER',discountType:'PERCENTAGE',discountValue:10,startTime:new Date(Date.now()-86400000),endTime:new Date(Date.now()+14*86400000),status:'ACTIVE',products:products.slice(0,3).map(p=>p._id)});
await db.getLocalMenuModel().create([{title:'Shop',type:'CUSTOM_LINK',link:'/products',order:1},{title:'Promotions',type:'CUSTOM_LINK',link:'/promotions',order:2},{title:'Upload Prescription',type:'CUSTOM_LINK',link:'/upload-prescription',order:3},{title:'About Us',type:'CUSTOM_LINK',link:'/about-us',order:4}]);
await db.getLocalHeroModel().create({image:'http://127.0.0.1:5173/assets/images/zada-logo.webp',imagekitFileId:'local-demo-only',isActive:true,order:0});
await db.getLocalStaffModel().create({name:'Demo Pharmacy Team',role:'Pharmacy Operations',description:'Sample staff record for the local demonstration'});
await import('./index.js');
console.log('Local presentation demo ready. Data is temporary and illustrative.');
for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{await mongo.stop();process.exit(0);});
