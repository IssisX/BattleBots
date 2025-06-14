import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function PartCategory({ category }) {
    const [isOpen, setIsOpen] = useState(true);
    // Guard against missing category or items, though in practice category should always be provided.
    if (!category || !category.items) {
        // console.warn("PartCategory: category or category.items is undefined", category);
        return null;
    }

    return (
        React.createElement('div', { className: "bg-white/5 rounded-lg border border-cyan-400/20 overflow-hidden transition-all duration-300" },
            React.createElement('button', {
                onClick: () => setIsOpen(!isOpen),
                className: "w-full flex justify-between items-center p-4 bg-white/10 hover:bg-white/20 transition",
                'aria-expanded': isOpen, // Accessibility: indicate expanded state
                'aria-controls': `category-items-${category.id}` // Accessibility: associate button with content
            },
                React.createElement('div', { className: "flex items-center gap-3" },
                    React.createElement('span', { className: "text-cyan-400" }, category.icon), // Assumes category.icon is a React element
                    React.createElement('h3', { className: "font-bold text-lg uppercase tracking-wider" }, category.name)
                ),
                isOpen ? React.createElement(ChevronUp) : React.createElement(ChevronDown)
            ),
            isOpen && React.createElement('div', {
                id: `category-items-${category.id}`, // Accessibility: content controlled by button
                className: "p-4 space-y-3"
            },
                Object.entries(category.items).map(([partKey, part]) => (
                    React.createElement('div', {
                        key: partKey,
                        draggable: true,
                        onDragStart: (e) => {
                            e.dataTransfer.setData("text/plain", partKey); // partKey is like 'chassis_light'
                        },
                        className: "p-3 bg-black/40 rounded-md cursor-grab active:cursor-grabbing hover:bg-cyan-400/20 group border border-transparent hover:border-cyan-400/50 transition"
                    },
                        React.createElement('h4', { className: "font-bold text-white" }, part.name),
                        React.createElement('p', { className: "text-xs text-gray-400 group-hover:text-gray-300 transition" }, part.description),
                        React.createElement('div', { className: "flex justify-between text-xs mt-2 text-cyan-300" },
                            React.createElement('span', null, `Cost: ${part.cost}`),
                            React.createElement('span', null, `Weight: ${part.weight}`)
                        )
                    )
                ))
            )
        )
    );
}

// export default PartCategory;
