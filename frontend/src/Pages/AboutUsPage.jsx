import { Link } from "react-router-dom";
import { Award, MapPin, Phone, Mail, Heart, ShieldCheck, Stethoscope, Star } from "lucide-react";

const PHARMACY_PHOTOS = [
    { src: "/assets/images/pharmacy-5.jpg", alt: "Zada Pharmacy – Main Floor" },
    { src: "/assets/images/pharmacy-1.jpg", alt: "Zada Pharmacy – Products Display" },
    { src: "/assets/images/pharmacy-6.jpg", alt: "Zada Pharmacy – Wide View" },
    { src: "/assets/images/pharmacy-2.jpg", alt: "Zada Pharmacy – Personal Care" },
    { src: "/assets/images/pharmacy-3.jpg", alt: "Zada Pharmacy – Hair & Beauty" },
    { src: "/assets/images/pharmacy-4.jpg", alt: "Zada Pharmacy – Skin Care Counter" },
];

const STATS = [
    { value: "4,000+", label: "Products" },
    { value: "10+", label: "Years Experience" },
    { value: "50,000+", label: "Happy Customers" },
    { value: "2 hrs", label: "Delivery Time" },
];

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-[#f6f8f2] font-sans">

            {/* ── HERO BANNER ───────────────────────────────────────── */}
            <section className="relative bg-gradient-to-br from-[#173925] via-[#1e4d2e] to-[#2a6b40] text-white overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />

                <div className="site-shell py-16 md:py-24 relative z-10">
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                            <Heart size={13} className="text-[#bce384]" /> Our Story
                        </span>
                        <h1 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight mb-5">
                            Healthcare &amp; Wellness,<br />
                            <em className="font-light not-italic text-[#bce384]">Redefined.</em>
                        </h1>
                        <p className="text-white/75 text-base md:text-lg leading-relaxed max-w-xl">
                            Founded by a distinguished ENT surgeon, Zada Pharmacy was built on a single promise — give every patient and customer access to genuine medicines, expert advice, and premium health products under one roof.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── STATS STRIP ───────────────────────────────────────── */}
            <section className="bg-white border-b border-gray-100">
                <div className="site-shell py-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
                        {STATS.map((s) => (
                            <div key={s.label} className="px-8 py-7 text-center">
                                <p className="text-3xl font-black text-[#1e4d2e]">{s.value}</p>
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FOUNDER SECTION — FULL WIDTH ──────────────────────── */}
            <section className="relative overflow-hidden">
                {/* Full-width founder image */}
                <div className="relative w-full" style={{ minHeight: "560px" }}>
                    <img
                        src="/assets/images/founder-dr-bakht-zada.png"
                        alt="Dr. Bakht Zada – Founder & ENT Surgeon"
                        className="w-full h-full object-cover object-center"
                        style={{ minHeight: "560px", maxHeight: "700px" }}
                    />
                    {/* Gradient overlay — left side for text, right stays photo */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0d2718f5] via-[#0d271890] to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d2718cc] via-transparent to-transparent" />

                    {/* Content overlay */}
                    <div className="absolute inset-0 flex items-center">
                        <div className="site-shell w-full">
                            <div className="max-w-xl py-12">
                                <span className="inline-flex items-center gap-2 bg-[#bce384]/20 border border-[#bce384]/40 text-[#bce384] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                                    <Stethoscope size={13} /> Founder &amp; Patron
                                </span>

                                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-2">
                                    Dr. Bakht Zada
                                </h2>
                                <p className="text-[#bce384] font-semibold text-sm mb-6">
                                    MBBS · FCPS (ENT) · ENT, Voice &amp; Thyroid Surgeon
                                </p>

                                <blockquote className="border-l-4 border-[#bce384] pl-5 mb-8">
                                    <p className="text-white/85 leading-relaxed text-base italic">
                                        "As a physician, I witnessed countless patients struggle to find authentic medicines. That frustration became the seed for Zada Pharmacy — a place where every shelf is stocked with trust, and every customer is treated like a patient who deserves the best care."
                                    </p>
                                </blockquote>

                                {/* Credential badges */}
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { icon: Award, text: "FCPS Certified ENT Surgeon" },
                                        { icon: Stethoscope, text: "Voice & Thyroid Specialist" },
                                        { icon: ShieldCheck, text: "Verified Products" },
                                        { icon: Star, text: "4,000+ Products" },
                                    ].map(({ icon: Icon, text }) => (
                                        <div key={text} className="flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                                            <Icon size={13} className="text-[#bce384] shrink-0" />
                                            <span className="text-xs font-semibold text-white">{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── PHARMACY GALLERY ──────────────────────────────────── */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="site-shell">
                    <div className="text-center mb-10">
                        <span className="inline-flex items-center gap-2 text-[#2a6b40] bg-[#e8f5d6] border border-[#bce384] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                            <MapPin size={13} /> Step Inside
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-[#173925] tracking-tight">Our Pharmacy</h2>
                        <p className="text-gray-500 mt-2 max-w-lg mx-auto text-sm leading-relaxed">
                            A modern, welcoming space designed around you — organized aisles, knowledgeable staff, and everything you need for complete wellbeing.
                        </p>
                    </div>

                    {/* Gallery grid — 6 photos, first featured large */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        {PHARMACY_PHOTOS.map((photo, i) => (
                            <div
                                key={photo.alt}
                                className={`relative overflow-hidden rounded-2xl shadow-md group ${i === 0 ? "col-span-2 md:col-span-2 row-span-2" : ""}`}
                                style={{ aspectRatio: i === 0 ? "16/9" : "4/3" }}
                            >
                                <img
                                    src={photo.src}
                                    alt={photo.alt}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0d2718b0] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <p className="text-white text-xs font-semibold">{photo.alt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MISSION & VISION ──────────────────────────────────── */}
            <section className="py-16 bg-[#f6f8f2]">
                <div className="site-shell">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 rounded-xl bg-[#2a6b40] text-white flex items-center justify-center mb-5">
                                <Heart size={22} />
                            </div>
                            <h3 className="text-xl font-black text-[#173925] mb-3">Our Mission</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                To make genuine, high-quality healthcare products accessible to every family — backed by medical expertise, honest pricing, and compassionate service that treats every customer as a patient deserving the best.
                            </p>
                        </div>
                        <div className="bg-[#1e4d2e] rounded-2xl p-8 shadow-sm text-white">
                            <div className="w-12 h-12 rounded-xl bg-white/15 text-white flex items-center justify-center mb-5 border border-white/20">
                                <Star size={22} />
                            </div>
                            <h3 className="text-xl font-black mb-3">Our Vision</h3>
                            <p className="text-white/75 leading-relaxed text-sm">
                                To become Pakistan's most trusted health and wellness destination — where every product is verified, every team member is trained, and every visit improves lives.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────── */}
            <section className="py-16 bg-gradient-to-br from-[#173925] to-[#2a6b40] text-white">
                <div className="site-shell text-center">
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                        Your Health is Our Priority
                    </h2>
                    <p className="text-white/70 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
                        Browse 4,000+ verified health &amp; wellness products, upload a prescription for 2-hour delivery, or speak to our trained pharmacy team.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <Link to="/products" className="inline-flex items-center gap-2 bg-[#bce384] hover:bg-[#cbea9d] text-[#173925] px-7 py-3.5 rounded-xl font-black text-sm transition-colors shadow-lg">
                            Browse Products
                        </Link>
                        <Link to="/upload-prescription" className="inline-flex items-center gap-2 border border-white/30 hover:border-white/60 text-white px-7 py-3.5 rounded-xl font-bold text-sm transition-colors">
                            Upload Prescription
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
