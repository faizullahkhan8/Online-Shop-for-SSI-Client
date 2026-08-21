import React from "react";
import LexicalEditor from "./LexicalEditor";
import { Plus, X, ArrowUp, ArrowDown } from "lucide-react";

export default function ProductDetailsBuilder({ details = [], onChange }) {
    const addSection = () => {
        onChange([...details, { title: "", contentHTML: "", contentJSON: "" }]);
    };

    const removeSection = (index) => {
        const updated = [...details];
        updated.splice(index, 1);
        onChange(updated);
    };

    const moveSection = (index, direction) => {
        if ((direction === -1 && index === 0) || (direction === 1 && index === details.length - 1)) return;
        const updated = [...details];
        const temp = updated[index];
        updated[index] = updated[index + direction];
        updated[index + direction] = temp;
        onChange(updated);
    };

    const updateTitle = (index, newTitle) => {
        const updated = [...details];
        updated[index].title = newTitle;
        onChange(updated);
    };

    const updateContent = (index, { html, json }) => {
        const updated = [...details];
        updated[index].contentHTML = html;
        updated[index].contentJSON = json;
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {details.map((section, idx) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm relative group">
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateTitle(idx, e.target.value)}
                            placeholder="e.g. USAGE AND SAFETY"
                            className="flex-1 text-sm font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => moveSection(idx, -1)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded"><ArrowUp size={16} /></button>
                            <button type="button" onClick={() => moveSection(idx, 1)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded"><ArrowDown size={16} /></button>
                            <button type="button" onClick={() => removeSection(idx)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded ml-1"><X size={16} /></button>
                        </div>
                    </div>
                    <LexicalEditor
                        initialHtml={section.contentHTML}
                        initialJson={section.contentJSON}
                        onChange={(data) => updateContent(idx, data)}
                        placeholder="Enter rich details..."
                    />
                </div>
            ))}
            <button
                type="button"
                onClick={addSection}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-sm font-bold uppercase tracking-wider"
            >
                <Plus size={16} /> Add Detail Section
            </button>
        </div>
    );
}
