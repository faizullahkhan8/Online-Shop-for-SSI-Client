const SpacerSection = ({ config }) => {
    return (
        <div style={{ height: `${config.height || 40}px` }} className="w-full flex items-center justify-center">
            {config.showDivider && (
                <div className="w-full max-w-[1400px] mx-auto border-t" style={{ borderColor: config.dividerColor || "#E5E7EB" }} />
            )}
        </div>
    );
};

export default SpacerSection;
