import React from 'react';
import { Trash2, Save, TestTube2, ArrowLeft } from 'lucide-react';
// import { PartCategory } from './PartCategory'; // This will be passed as PartCategoryComponent prop

export function PartPalette({ onClear, onTest, onSave, onExit, partDefinitionsData, PartCategoryComponent }) {
    if (!partDefinitionsData || !PartCategoryComponent) {
        // console.warn("PartPalette: partDefinitionsData or PartCategoryComponent is undefined");
        return null; // Or some fallback UI
    }

    return (
        React.createElement('div', { className: "h-full w-full bg-black/80 backdrop-blur-md p-4 flex flex-col gap-4 overflow-y-auto" },
            React.createElement('div', { className: "flex justify-between items-center border-b-2 border-cyan-400/50 pb-3" },
                React.createElement('button', { onClick: onExit, className: "p-2 rounded-full hover:bg-white/10 transition" },
                    React.createElement(ArrowLeft, { size: 20 })
                ),
                React.createElement('h2', { className: "text-2xl font-bold text-center uppercase tracking-widest", style: { fontFamily: "'Orbitron', sans-serif" } }, "Parts"),
                React.createElement('div', { className: "w-8" }) // Spacer
            ),
            React.createElement('div', { className: "flex-grow space-y-4" },
                Object.values(partDefinitionsData).map(cat =>
                    React.createElement(PartCategoryComponent, { key: cat.id, category: cat })
                )
            ),
            React.createElement('div', { className: "grid grid-cols-2 gap-2 pt-2 border-t border-cyan-400/20" },
                React.createElement('button', { onClick: onClear, className: "builder-button bg-red-500/80 hover:bg-red-500" },
                    React.createElement(Trash2, { size: 16 }), " Clear"
                ),
                React.createElement('button', { onClick: onSave, className: "builder-button bg-blue-500/80 hover:bg-blue-500" },
                    React.createElement(Save, { size: 16 }), " Save"
                ),
                React.createElement('button', { onClick: onTest, className: "col-span-2 builder-button bg-green-500/80 hover:bg-green-500" },
                    React.createElement(TestTube2, { size: 16 }), " Test in Arena"
                )
            )
        )
    );
}

// export default PartPalette;
