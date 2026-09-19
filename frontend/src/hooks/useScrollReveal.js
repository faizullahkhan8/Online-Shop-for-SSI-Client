import { useEffect } from "react";

/**
 * Lightweight IntersectionObserver that adds `.is-visible` to all
 * `.product-card-enter` elements when they scroll into view.
 * Replaces per-card framer-motion instances (~120KB → 0KB).
 */
const useScrollReveal = (containerRef, selector = ".product-card-enter") => {
    useEffect(() => {
        const root = containerRef?.current || document;
        const elements = root.querySelectorAll(selector);
        if (!elements.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: "-40px 0px", threshold: 0.1 }
        );

        elements.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [containerRef, selector]);
};

export default useScrollReveal;
