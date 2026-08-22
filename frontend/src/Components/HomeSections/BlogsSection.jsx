import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Leaf, Apple, Bandage } from "lucide-react";
import SectionHeader from "./SectionHeader";

const DEFAULT_BLOGS = [
    { title: "Top 7 Essential Vitamins for Daily Immunity in Summer", readTime: "4 min read", category: "Nutrition", author: "Dr. Ayesha Malik", icon: <Apple size={18} strokeWidth={2} />, accentColor: "#4d8d3a" },
    { title: "First Aid Kit Checklist: 10 Must-Have Medicines for Every Home", readTime: "5 min read", category: "Emergency Care", author: "Pharmacist Tariq", icon: <Bandage size={18} strokeWidth={2} />, accentColor: "#4d8d3a" },
    { title: "Seasonal Allergy Symptoms, Causes and Safe Treatment Options", readTime: "3 min read", category: "Wellness", author: "Dr. Hamza Khan", icon: <Leaf size={18} strokeWidth={2} />, accentColor: "#4d8d3a" },
];

const BlogsSection = ({ config }) => {
    const blogsList = config.blogs?.length ? config.blogs : DEFAULT_BLOGS;

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} cta={config.ctaText} ctaPath={config.ctaLink} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {blogsList.map((blog, idx) => {
                    const accentColor = blog.accentColor || "#4d8d3a";
                    return (
                        <article key={idx}
                            className="bg-white rounded-3xl border border-gray-100 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 group cursor-pointer overflow-hidden">
                            <div className="h-1.5 w-full bg-primary" />
                            <div className="p-5 sm:p-6 flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-xl bg-primary-pale text-primary flex items-center justify-center shrink-0 shadow-inner">
                                            {blog.icon || <Leaf size={18} strokeWidth={2} />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary bg-primary-pale px-3 py-1.5 rounded-full">{blog.category}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
                                        <BookOpen size={12} className="text-gray-400" /> {blog.readTime}
                                    </span>
                                </div>
                                <h3 className="font-sans font-black text-sm sm:text-base text-gray-900 group-hover:text-primary transition-colors leading-snug mb-auto">{blog.title}</h3>
                                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-bold">By {blog.author}</span>
                                    <span className="text-xs font-black text-primary flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                                        Read Article <ArrowRight size={14} strokeWidth={3} />
                                    </span>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default BlogsSection;
