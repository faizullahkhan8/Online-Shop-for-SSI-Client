import { Link } from "react-router-dom";
import { Activity, HeartPulse, Pill, Stethoscope, Baby, Smile } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { getImageUrl } from "../../utils/imageHelper";

const CONDITION_ICONS = { Activity, HeartPulse, Pill, Stethoscope, Baby, Smile };

const ConditionsSection = ({ config }) => {
    const conditions = config.conditions || [];
    if (conditions.length === 0) return null;

    return (
        <section className="site-shell mt-14">
            <SectionHeader title={config.title} subtitle={config.subtitle} />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {conditions.map((cond, idx) => {
                    const Icon = CONDITION_ICONS[cond.icon] || Activity;
                    return <Link key={idx} to={cond.link || "/products"}
                        className="bg-white rounded-3xl border border-gray-100 p-2.5 pb-4 flex flex-col items-center text-center group hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm overflow-hidden">
                        <div className="w-full aspect-square rounded-2xl bg-primary-pale text-primary flex items-center justify-center mb-4 overflow-hidden border border-primary/10">
                            {cond.image ? (
                                <img
                                    src={getImageUrl(cond.image)}
                                    alt={`${cond.name || "Health condition"} care`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                        event.currentTarget.nextElementSibling?.classList.remove("hidden");
                                    }}
                                />
                            ) : null}
                            <Icon size={30} className={cond.image ? "hidden" : ""} />
                        </div>
                        <h4 className="px-2 text-[12px] sm:text-[13px] font-black text-gray-900 group-hover:text-primary transition-colors leading-snug mb-1">{cond.name}</h4>
                        <span className="px-2 text-[10px] text-gray-500 font-semibold leading-snug">{cond.desc}</span>
                    </Link>;
                })}
            </div>
        </section>
    );
};

export default ConditionsSection;
