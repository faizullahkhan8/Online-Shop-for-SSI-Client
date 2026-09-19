import { ShieldCheck, Truck, PhoneCall, CheckCircle } from "lucide-react";
import { getImageUrl } from "../../utils/imageHelper";

const BADGE_ICONS = { ShieldCheck, Truck, PhoneCall, CheckCircle };

const TrustBadges = ({ config }) => {
    const badges = config?.badges || [];
    if (badges.length === 0) return null;

    return (
        <div className="site-shell mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.map((badge, i) => {
                    const Icon = BADGE_ICONS[badge.icon] || ShieldCheck;
                    return (
                    <div key={i} className="group bg-white rounded-2xl border border-gray-100 px-3.5 py-3 flex items-center gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                        <div className="w-14 h-14 rounded-2xl bg-primary-pale text-primary flex items-center justify-center shrink-0 overflow-hidden border border-primary/10">
                            {badge.image ? (
                                <img
                                    src={getImageUrl(badge.image)}
                                    alt={`${badge.title || "Trust badge"} illustration`}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                        event.currentTarget.nextElementSibling?.classList.remove("hidden");
                                    }}
                                />
                            ) : null}
                            <Icon size={22} className={badge.image ? "hidden" : ""} />
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">{badge.title}</p>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 mt-1 leading-snug">{badge.desc}</p>
                        </div>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrustBadges;
