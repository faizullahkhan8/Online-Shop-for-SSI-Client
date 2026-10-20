import { useEffect, useRef, useState } from "react";
import { geocode, samePosition, validPosition } from "../utils/location.js";

export function useAddressLookup({ position, text = "", savedPosition, savedText = "", onPosition, onAddress }) {
    const latest = useRef({ position, text, onPosition, onAddress });
    const forwardPin = useRef(null), reverseText = useRef(null);
    const [reverseBusy, setReverseBusy] = useState(false), [forwardBusy, setForwardBusy] = useState(false);
    useEffect(() => { latest.current = { position, text, onPosition, onAddress }; });
    useEffect(() => {
        const pin = validPosition(position);
        if (!pin || samePosition(pin, savedPosition) || samePosition(pin, forwardPin.current)) return;
        const originalText = latest.current.text;
        let active = true;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setReverseBusy(true);
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const data = await geocode("reverse", pin, controller.signal);
                if (active && data && latest.current.text === originalText) {
                    reverseText.current = data.display_name;
                    latest.current.onAddress(data);
                }
            } catch { /* Keep the selected pin and user's address on provider failure. */ }
            finally { clearTimeout(timeout); if (active) setReverseBusy(false); }
        }, 1000);
        return () => { active = false; clearTimeout(timer); controller.abort(); setReverseBusy(false); };
    }, [position?.lat, position?.lng, savedPosition?.lat, savedPosition?.lng]);
    useEffect(() => {
        if (text.length < 5 || text === savedText || text === reverseText.current) return;
        const originalPin = latest.current.position;
        let active = true;
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setForwardBusy(true);
            const timeout = setTimeout(() => controller.abort(), 10000);
            try {
                const pin = await geocode("search", text, controller.signal);
                if (active && pin && samePosition(originalPin, latest.current.position)) {
                    forwardPin.current = pin;
                    latest.current.onPosition(pin);
                }
            } catch { /* Do not erase a manually supplied address or pin. */ }
            finally { clearTimeout(timeout); if (active) setForwardBusy(false); }
        }, 1500);
        return () => { active = false; clearTimeout(timer); controller.abort(); setForwardBusy(false); };
    }, [text, savedText]);
    return reverseBusy || forwardBusy;
}
