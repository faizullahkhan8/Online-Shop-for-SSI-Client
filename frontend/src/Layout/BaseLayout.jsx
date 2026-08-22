import { Outlet } from "react-router-dom";
import Header from "../Components/Bars/Header";
import Footer from "../Components/Home/Footer";
import MobileBottomNav from "../Components/Bars/MobileBottomNav";
import GlobalWhatsappFab from "../Components/HomeSections/GlobalWhatsappFab";

const BaseLayout = () => {
    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
            <Header />

            <main className="flex-1 bg-[#fafbfc] text-slate-900 pb-20 md:pb-0">
                <Outlet />
            </main>

            <Footer />
            
            <MobileBottomNav />
            <GlobalWhatsappFab />
        </div>
    );
};

export default BaseLayout;
