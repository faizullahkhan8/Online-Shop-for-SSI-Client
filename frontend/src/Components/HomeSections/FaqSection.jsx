import { HelpCircle } from "lucide-react";
import SectionHeader from "./SectionHeader";

const DEFAULT_FAQS = [
    { q: "How fast is delivery?", a: "We deliver within 2 hours in major cities across Pakistan. Express delivery is available for urgent medications." },
    { q: "Are your medicines authentic?", a: "Yes, we source 100% of our inventory directly from licensed pharmaceutical manufacturers and authorized distributors." },
    { q: "Do I need a prescription?", a: "A valid prescription is required only for Rx (prescription) medicines. Over-the-counter (OTC) products can be purchased directly." },
    { q: "What is your return policy?", a: "We offer a 7-day hassle-free return policy for sealed and undamaged products, excluding temperature-sensitive items." }
];

const FaqSection = ({ config }) => {
    const faqs = config.faqs?.length ? config.faqs : DEFAULT_FAQS;

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {faqs.map((faq, i) => (
                    <div key={i} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-light transition-all duration-300">
                        <h4 className="font-black text-sm text-gray-900 mb-2.5 flex items-start gap-3">
                            <HelpCircle size={18} className="text-primary shrink-0 mt-0.5" />
                            {faq.q}
                        </h4>
                        <p className="text-xs font-bold text-gray-500 pl-7 leading-relaxed">{faq.a}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FaqSection;
