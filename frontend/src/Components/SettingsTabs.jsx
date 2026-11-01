import { createElement } from "react";
import { Receipt, Truck, CreditCard, MessageSquare } from "lucide-react";

const tabs = [
    { id: "tax", label: "Tax", icon: Receipt },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "sms", label: "SMS", icon: MessageSquare },
];

export function SettingsTabs({ active, onChange, id }) {
    const handleKeyDown = (event, index) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        onChange(tabs[next].id);
        event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus({ preventScroll: true });
    };
    return <div role="tablist" aria-label="Settings sections" className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 sm:grid-cols-4">
        {tabs.map(({ id: key, label, icon: Icon }, index) => <button key={key} type="button" role="tab"
            id={`${id}-tab-${key}`} aria-controls={`${id}-panel-${key}`} aria-selected={active === key} tabIndex={active === key ? 0 : -1}
            onClick={() => onChange(key)} onKeyDown={event => handleKeyDown(event, index)}
            className={`flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark ${active === key ? "border-primary-dark bg-white text-primary-dark shadow-sm" : "border-transparent text-gray-600 hover:bg-white hover:text-gray-900"}`}>
            {createElement(Icon, { size: 18, "aria-hidden": true })}<span>{label}</span>
        </button>)}
    </div>;
}

// Retain mounted controls so changing tabs never discards an unsaved edit.
export function SettingsTabPanel({ active, name, id, children }) {
    return <div role="tabpanel" id={`${id}-panel-${name}`} aria-labelledby={`${id}-tab-${name}`}
        hidden={active !== name} tabIndex={0} className="rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-dark">
        {children}
    </div>;
}
