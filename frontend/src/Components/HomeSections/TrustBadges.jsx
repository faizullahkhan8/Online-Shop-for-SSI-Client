import { ShieldCheck, Truck, PhoneCall, CheckCircle } from "lucide-react";

const DEFAULT_BADGES = [
    { icon: <ShieldCheck size={20} />, title: "100% Genuine", desc: "Licensed pharmacy sourcing" },
    { icon: <Truck size={20} />, title: "2-Hour Delivery", desc: "Major cities covered" },
    { icon: <PhoneCall size={20} />, title: "24/7 Support", desc: "Expert pharmacist advice" },
    { icon: <CheckCircle size={20} />, title: "Easy Returns", desc: "7-day hassle-free policy" },
];

const TrustBadges = ({ config }) => {
    // If the config comes with badges, try to map the icons from our defaults
    const badges = config?.badges?.length
        ? config.badges.map(b => {
            const defaultBadge = DEFAULT_BADGES.find(t => t.title === b.title) || DEFAULT_BADGES[0];
            return { ...b, icon: defaultBadge.icon };
        })
        : DEFAULT_BADGES;

    return (
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.map((badge, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200">
                        <div className="w-9 h-9 rounded-xl bg-primary-pale text-primary flex items-center justify-center shrink-0">
                            {badge.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900">{badge.title}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{badge.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustBadges;
