const StatsCounter = ({ config }) => {
    return (
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-8 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {(config.stats || []).slice(0, 4).map((s, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100 hover:border-primary-light hover:shadow-md transition-all duration-300">
                        <h4 className="text-xl font-black text-primary">{s.value}</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatsCounter;
