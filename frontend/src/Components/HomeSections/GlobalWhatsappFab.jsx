import { useEffect, useState } from "react";
import { useGetHomePage } from "../../api/hooks/homePage.api";
import WhatsappFab from "./WhatsappFab";

const GlobalWhatsappFab = () => {
    const { data: homePageData } = useGetHomePage();

    const fabSection = homePageData?.sections?.find(s => s.type === "whatsapp_fab");
    const isVisible = fabSection?.isVisible;
    const config = fabSection?.config;

    if (!isVisible || !config) return null;

    return <WhatsappFab config={config} />;
};

export default GlobalWhatsappFab;
