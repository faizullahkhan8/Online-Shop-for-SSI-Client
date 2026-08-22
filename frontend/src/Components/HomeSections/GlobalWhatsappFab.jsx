import { useEffect, useState } from "react";
import { useGetHomePage } from "../../api/hooks/homePage.api";
import WhatsappFab from "./WhatsappFab";

const GlobalWhatsappFab = () => {
    const { getHomePage } = useGetHomePage();
    const [config, setConfig] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        (async () => {
            const res = await getHomePage();
            if (res?.success && res?.sections) {
                const fabSection = res.sections.find(s => s.type === "whatsapp_fab");
                if (fabSection && fabSection.isVisible) {
                    setConfig(fabSection.config);
                    setIsVisible(true);
                }
            }
        })();
    }, []);

    if (!isVisible || !config) return null;

    return <WhatsappFab config={config} />;
};

export default GlobalWhatsappFab;
