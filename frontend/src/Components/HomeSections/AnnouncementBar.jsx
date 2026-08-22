import { Link } from "react-router-dom";

const AnnouncementBar = ({ config }) => {
    return (
        <div style={{ backgroundColor: config.bgColor, color: config.textColor }} className="marquee-container w-full py-2 text-xs sm:text-sm font-medium flex items-center overflow-hidden">
            <div className="animate-marquee flex items-center gap-2 px-4 whitespace-nowrap">
                <span>{config.text}</span>
                {config.link && (
                    <Link to={config.link} className="underline font-bold hover:opacity-80 transition-opacity">
                        {config.linkText}
                    </Link>
                )}
            </div>
        </div>
    );
};

export default AnnouncementBar;
