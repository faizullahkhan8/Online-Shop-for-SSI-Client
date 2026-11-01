import { useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { useDialog } from "../hooks/useDialog";

// Keep the dialog mounted, focused and scroll-locked until its exit finishes.
function DrawerSurface({ onClose, label, labelledBy, className, children }) {
    const panel = useRef(null);
    const reduceMotion = useReducedMotion();
    useDialog(true, onClose, panel);
    const duration = reduceMotion ? 0.1 : 0.38;
    const exitDuration = reduceMotion ? 0.1 : 0.24;
    return <Motion.div className="fixed inset-0 z-[1001] overflow-hidden" initial="closed" animate="open" exit="closed">
        <Motion.div data-dialog-backdrop="" aria-hidden="true"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            variants={{ closed: { opacity: 0, transition: { duration: exitDuration } }, open: { opacity: 1, transition: { duration } } }} />
        <Motion.div ref={panel} role="dialog" aria-modal="true" aria-label={label} aria-labelledby={labelledBy} tabIndex={-1}
            className={`absolute inset-y-0 right-0 flex h-dvh flex-col bg-white shadow-2xl ${className}`}
            variants={{
                closed: { x: reduceMotion ? 0 : "100%", opacity: reduceMotion ? 0 : 1, transition: { duration: exitDuration, ease: [0.4, 0, 1, 1] } },
                open: { x: 0, opacity: 1, transition: { duration, ease: [0.22, 1, 0.36, 1] } },
            }}>
            {children}
        </Motion.div>
    </Motion.div>;
}

export default function AnimatedDrawer({ isOpen, onClose, label, labelledBy, className = "w-[85%] max-w-[380px]", children }) {
    return createPortal(<AnimatePresence>
        {isOpen && <DrawerSurface key="drawer" onClose={onClose} label={label} labelledBy={labelledBy} className={className}>
            {children}
        </DrawerSurface>}
    </AnimatePresence>, document.body);
}
