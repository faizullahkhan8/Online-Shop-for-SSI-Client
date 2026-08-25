import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Universal Scroll Restoration Component
 * Automatically resets scroll to (0, 0) upon route navigation,
 * handles hash anchor scrolling (e.g., #reviews), and preserves
 * browser history POP back/forward positioning.
 */
const ScrollToTop = () => {
    const { pathname, search, hash } = useLocation();
    const navType = useNavigationType();

    useEffect(() => {
        // If navigation was a back/forward (POP), let the browser handle scroll restoration
        if (navType === "POP") {
            return;
        }

        // If there is a hash anchor in the URL (e.g. #reviews, #faq)
        if (hash) {
            setTimeout(() => {
                const element = document.getElementById(hash.replace("#", ""));
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                }
            }, 50);
            return;
        }

        // Otherwise, reset window scroll to the top
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, [pathname, search, hash, navType]);

    return null;
};

export default ScrollToTop;
