import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

import staffSchema from "./models/staff.model.js";

// Curated Unsplash portrait images — direct CDN URLs (no watermarks)
const MALE_IMAGES = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1548449112-96a38a643324?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face",
];

const FEMALE_IMAGES = [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1614204424926-196a80bf0be8?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop&crop=face",
];

// Staff tree data
// Level 0: CEO (no parent)
// Level 1: Department Heads (report to CEO)
// Level 2: Managers / Senior Staff
// Level 3: Specialists / Staff

const STAFF_SEED = [
    // CEO — Level 0
    {
        key: "ceo",
        name: "Dr. Faiz Ullah Khan",
        role: "Chief Executive Officer",
        description: "<p>Visionary leader and founder of Zada Online Pharmacy with over 15 years of experience in pharmaceutical retail and healthcare management. Committed to making genuine medicine accessible to all.</p>",
        image: MALE_IMAGES[0],
        parentKey: null,
    },

    // Level 1 — Department Heads
    {
        key: "cmo",
        name: "Dr. Sana Mirza",
        role: "Chief Medical Officer",
        description: "<p>Specialist physician overseeing clinical governance, prescription verification and patient safety standards across all pharmacy services.</p>",
        image: FEMALE_IMAGES[0],
        parentKey: "ceo",
    },
    {
        key: "coo",
        name: "Usman Tariq",
        role: "Chief Operations Officer",
        description: "<p>Responsible for end-to-end supply chain, warehousing and last-mile delivery operations ensuring orders reach customers within the promised window.</p>",
        image: MALE_IMAGES[1],
        parentKey: "ceo",
    },
    {
        key: "cto",
        name: "Bilal Hussain",
        role: "Chief Technology Officer",
        description: "<p>Leads the engineering team building robust, scalable digital infrastructure for a seamless online pharmacy experience.</p>",
        image: MALE_IMAGES[2],
        parentKey: "ceo",
    },
    {
        key: "cfo",
        name: "Ayesha Raza",
        role: "Chief Financial Officer",
        description: "<p>Steers financial strategy, budgeting and investor relations while ensuring fiscal discipline across the organization.</p>",
        image: FEMALE_IMAGES[1],
        parentKey: "ceo",
    },

    // Level 2 — Under CMO
    {
        key: "pharmacist_lead",
        name: "Dr. Hina Baig",
        role: "Lead Pharmacist",
        description: "<p>Supervises prescription validation, drug interaction checks and patient counselling to guarantee safe dispensing of every order.</p>",
        image: FEMALE_IMAGES[2],
        parentKey: "cmo",
    },
    {
        key: "qa_manager",
        name: "Dr. Shahid Anwar",
        role: "Quality Assurance Manager",
        description: "<p>Ensures every product stocked meets regulatory standards and maintains cold-chain integrity for temperature-sensitive medicines.</p>",
        image: MALE_IMAGES[3],
        parentKey: "cmo",
    },

    // Level 2 — Under COO
    {
        key: "logistics_head",
        name: "Kamran Sheikh",
        role: "Head of Logistics",
        description: "<p>Manages rider networks, route optimisation and real-time delivery tracking to achieve industry-leading fulfillment speeds.</p>",
        image: MALE_IMAGES[4],
        parentKey: "coo",
    },
    {
        key: "warehouse_head",
        name: "Rabia Noor",
        role: "Warehouse Manager",
        description: "<p>Oversees inventory accuracy, FIFO rotation and stock replenishment cycles to prevent stockouts across product categories.</p>",
        image: FEMALE_IMAGES[3],
        parentKey: "coo",
    },

    // Level 2 — Under CTO
    {
        key: "dev_lead",
        name: "Asad Ali",
        role: "Lead Software Engineer",
        description: "<p>Architects the customer-facing platform and admin systems using modern full-stack technologies for performance and reliability.</p>",
        image: MALE_IMAGES[5],
        parentKey: "cto",
    },
    {
        key: "design_lead",
        name: "Maryam Iqbal",
        role: "Head of Design",
        description: "<p>Crafts intuitive, beautiful user experiences from research through to pixel-perfect implementation across web and mobile.</p>",
        image: FEMALE_IMAGES[4],
        parentKey: "cto",
    },

    // Level 2 — Under CFO
    {
        key: "accounts_manager",
        name: "Tariq Mehmood",
        role: "Accounts Manager",
        description: "<p>Manages vendor payments, reconciliation and financial reporting, ensuring transparent accounting practices.</p>",
        image: MALE_IMAGES[6],
        parentKey: "cfo",
    },

    // Level 3 — Specialists
    {
        key: "pharmacist_1",
        name: "Sara Ahmed",
        role: "Clinical Pharmacist",
        description: "<p>Reviews customer prescriptions and provides personalised medication guidance with empathy and precision.</p>",
        image: FEMALE_IMAGES[5],
        parentKey: "pharmacist_lead",
    },
    {
        key: "pharmacist_2",
        name: "Hassan Malik",
        role: "Dispensary Pharmacist",
        description: "<p>Handles dispensing operations and ensures accurate packaging of medicines before dispatch.</p>",
        image: MALE_IMAGES[7],
        parentKey: "pharmacist_lead",
    },
    {
        key: "qa_analyst",
        name: "Zainab Farooq",
        role: "QA Analyst",
        description: "<p>Conducts product batch audits and coordinates with suppliers to resolve quality issues proactively.</p>",
        image: FEMALE_IMAGES[6],
        parentKey: "qa_manager",
    },
    {
        key: "rider_coord",
        name: "Imran Javed",
        role: "Delivery Coordinator",
        description: "<p>Oversees daily rider assignments and resolves delivery escalations to maintain high customer satisfaction.</p>",
        image: MALE_IMAGES[8],
        parentKey: "logistics_head",
    },
    {
        key: "inventory_analyst",
        name: "Nadia Khan",
        role: "Inventory Analyst",
        description: "<p>Monitors stock levels, forecasts demand and triggers reorder points to keep shelves perpetually stocked.</p>",
        image: FEMALE_IMAGES[7],
        parentKey: "warehouse_head",
    },
    {
        key: "frontend_dev",
        name: "Zubair Ahmed",
        role: "Frontend Developer",
        description: "<p>Brings interfaces to life with modern React, smooth animations and pixel-perfect attention to detail.</p>",
        image: MALE_IMAGES[9],
        parentKey: "dev_lead",
    },
    {
        key: "ui_designer",
        name: "Aliya Sultan",
        role: "UI/UX Designer",
        description: "<p>Creates user flows, wireframes and high-fidelity prototypes that delight customers at every touchpoint.</p>",
        image: FEMALE_IMAGES[8],
        parentKey: "design_lead",
    },
    {
        key: "cs_agent",
        name: "Fareeha Alam",
        role: "Customer Support Lead",
        description: "<p>Champions customer experience by resolving queries swiftly and turning every interaction into a positive memory.</p>",
        image: FEMALE_IMAGES[9],
        parentKey: "coo",
    },
];

async function run() {
    const conn = await mongoose.createConnection(process.env.MONGO_URI_ONLINE, { dbName: "zada_pharmacy" }).asPromise();
    const Staff = conn.model("Staff", staffSchema);

    // Clear existing staff
    await Staff.deleteMany({});
    console.log("Cleared existing staff records.");

    // First pass: insert all without parentId to get real _id values
    const keyToId = {};
    const insertedDocs = {};

    for (const s of STAFF_SEED) {
        const doc = await Staff.create({
            name: s.name,
            role: s.role,
            description: s.description,
            image: s.image,
            parentId: null,
        });
        keyToId[s.key] = doc._id;
        insertedDocs[s.key] = doc;
    }

    // Second pass: wire up parentId references
    for (const s of STAFF_SEED) {
        if (s.parentKey) {
            await Staff.findByIdAndUpdate(keyToId[s.key], {
                parentId: keyToId[s.parentKey],
            });
        }
    }

    console.log(`✅  Seeded ${STAFF_SEED.length} staff members successfully.`);
    await conn.close();
    process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
