import React from 'react';

export function StatBar({ label, value, max, icon, colorClass = "from-cyan-400 to-blue-500" }) {
    return (
        React.createElement('div', null,
            React.createElement('div', { className: "flex justify-between items-center text-sm mb-1" },
                React.createElement('div', { className: "flex items-center gap-2 text-cyan-300" },
                    icon, // Icon is passed as a React element
                    React.createElement('span', { className: "font-bold uppercase tracking-wider" }, label)
                ),
                React.createElement('span', { className: "text-white font-mono" }, `${value} / ${max}`)
            ),
            React.createElement('div', { className: "w-full bg-black/50 rounded-full h-2.5 border border-white/10" },
                React.createElement('div', {
                    className: `bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-500`,
                    style: { width: `${Math.min((value / max) * 100, 100)}%` }
                })
            )
        )
    );
}

// export default StatBar;
