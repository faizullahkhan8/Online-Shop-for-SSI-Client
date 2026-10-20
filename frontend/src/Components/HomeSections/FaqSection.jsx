import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "./SectionHeader";

const FaqItem = ({ faq, isOpen, onToggle }) => {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-light transition-all duration-300 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-5 sm:p-6 text-left flex items-start gap-3 cursor-pointer"
            >
                <HelpCircle size={18} className="text-primary shrink-0 mt-0.5" />
                <span className="font-bold text-sm text-gray-900 flex-1">{faq.q}</span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 shrink-0 mt-0.5 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`}
                />
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pl-[52px]">
                            <p className="text-xs font-bold text-gray-500 leading-relaxed">{faq.a}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FaqSection = ({ config }) => {
    const faqs = config.faqs || [];
    const [openIndex, setOpenIndex] = useState(null);
    if (faqs.length === 0) return null;

    return (
        <section className="site-shell mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqs.map((faq, i) => (
                    <FaqItem
                        key={i}
                        faq={faq}
                        isOpen={openIndex === i}
                        onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                    />
                ))}
            </div>
        </section>
    );
};

export default FaqSection;
