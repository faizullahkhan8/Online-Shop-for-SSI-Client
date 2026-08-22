import { Link } from "react-router-dom";
import { Activity, HeartPulse, Pill, Stethoscope, Baby, Smile } from "lucide-react";
import SectionHeader from "./SectionHeader";

const DEFAULT_CONDITIONS = [
    { name: "Diabetes Care", icon: <Activity size={24} />, desc: "Insulin & Monitors" },
    { name: "Heart & Blood Pressure", icon: <HeartPulse size={24} />, desc: "Cardio Support" },
    { name: "Digestive Health", icon: <Pill size={24} />, desc: "Probiotics & Antacids" },
    { name: "Cold & Flu", icon: <Stethoscope size={24} />, desc: "Syrups & Lozenges" },
    { name: "Mother & Child", icon: <Baby size={24} />, desc: "Formula & Diapers" },
    { name: "Skin & Hair", icon: <Smile size={24} />, desc: "Derma & Sunscreen" },
];

const ConditionsSection = ({ config }) => {
    // If we wanted dynamic icons from config, we would map them here.
    // For now, using default conditions for pristine rendering.
    const conditions = config.conditions?.length ? config.conditions : DEFAULT_CONDITIONS;

    return (
        <section className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {conditions.map((cond, idx) => (
                    <Link key={idx} to="/products"
                        className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col items-center text-center group hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm">
                        <div className={`w-14 h-14 rounded-2xl bg-primary-pale text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner`}>
                            {cond.icon || <Activity size={24} />}
                        </div>
                        <h4 className="text-[12px] font-black text-gray-900 group-hover:text-primary transition-colors leading-snug mb-1">{cond.name}</h4>
                        <span className="text-[10px] text-gray-500 font-bold">{cond.desc}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default ConditionsSection;
