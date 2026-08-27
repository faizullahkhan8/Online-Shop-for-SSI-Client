import { MessageCircle } from "lucide-react";

const WhatsappFab = ({ config }) => {
    const { 
        phoneNumber = "+923001234567", 
        message = "Hello! I need help with my order.", 
        position = "right" 
    } = config || {};

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;

    const positionClasses = position === "left" 
        ? "left-6" 
        : "right-6";

    return (
        <a 
            href={whatsappUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`fixed max-md:bottom-24 md:bottom-6 ${positionClasses} z-[999] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-xl hover:scale-110 hover:shadow-2xl hover:bg-[#1EBE57] active:scale-95 transition-all duration-300 group`}
            aria-label="Contact us on WhatsApp"
        >
            <MessageCircle size={28} className="drop-shadow-sm" />
            
            {/* Tooltip */}
            <span className={`absolute ${position === "left" ? "left-16" : "right-16"} bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg`}>
                Chat with us!
                {/* Arrow */}
                <span className={`absolute top-1/2 -translate-y-1/2 ${position === "left" ? "-left-1 border-r-[5px] border-r-gray-900 border-y-transparent border-y-[5px]" : "-right-1 border-l-[5px] border-l-gray-900 border-y-transparent border-y-[5px]"}`}></span>
            </span>
        </a>
    );
};

export default WhatsappFab;
