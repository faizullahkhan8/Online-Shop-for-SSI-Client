import { Outlet } from "react-router-dom";
import Header from "../Components/Bars/Header";
import Footer from "../Components/Home/Footer";
import MobileBottomNav from "../Components/Bars/MobileBottomNav";

const BaseLayout = () => {
    return (
        <div className="min-h-screen flex flex-col gap-4 font-sans selection:bg-primary/10 selection:text-primary">
            <Header />

            <main className="flex-1 bg-[#fafbfc] text-slate-900 pb-20 md:pb-0">
                <Outlet />
            </main>

            <Footer />
            
            <MobileBottomNav />
        </div>
    );
};

export default BaseLayout;
