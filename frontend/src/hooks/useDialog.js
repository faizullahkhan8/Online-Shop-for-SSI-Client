import { useEffect, useLayoutEffect, useRef } from "react";

const openDialogs = [];
const focusable = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

// Shared keyboard and background handling for modal panels, including nested dialogs.
export function useDialog(isOpen, onClose, panelRef) {
    const closeRef = useRef(onClose);
    useEffect(() => { closeRef.current = onClose; }, [onClose]);
    useLayoutEffect(() => {
        if (!isOpen || !panelRef.current) return;
        const panel = panelRef.current;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        const background = [];
        let branch = panel;
        while (branch.parentElement && branch !== document.body) {
            for (const sibling of branch.parentElement.children) {
                if (sibling !== branch && sibling instanceof HTMLElement && !sibling.hasAttribute("data-dialog-backdrop")) {
                    background.push([sibling, sibling.inert]);
                    sibling.setAttribute("inert", "");
                }
            }
            branch = branch.parentElement;
        }
        document.body.style.overflow = "hidden";
        openDialogs.push(panel);
        const isTop = () => openDialogs.at(-1) === panel;
        const controls = () => [...panel.querySelectorAll(focusable)].filter(node => node.getClientRects().length && !node.closest('[inert]'));
        const focusFirst = () => (panel.querySelector('input:not(:disabled)') || controls()[0] || panel).focus();
        focusFirst();
        const onKeyDown = event => {
            if (!isTop()) return;
            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                closeRef.current();
            } else if (event.key === "Tab") {
                const items = controls();
                const first = items[0], last = items.at(-1);
                if (!items.length) { event.preventDefault(); panel.focus(); }
                else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
                    event.preventDefault(); last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
                    event.preventDefault(); first.focus();
                }
            }
        };
        const onFocus = event => { if (isTop() && !panel.contains(event.target)) focusFirst(); };
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("focusin", onFocus);
        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("focusin", onFocus);
            openDialogs.splice(openDialogs.indexOf(panel), 1);
            background.forEach(([node, inert]) => { node.toggleAttribute("inert", inert); });
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus();
        };
    }, [isOpen, panelRef]);
}
