import React from 'react';

export function HealthBar({ name, health, maxHealth, isPlayer }) {
    return (
        React.createElement('div', { className: `w-full max-w-sm p-3 rounded-lg border-2 ${isPlayer ? 'border-cyan-400' : 'border-red-500'} bg-black/70` },
            React.createElement('div', { className: "flex justify-between items-center mb-1" },
                React.createElement('span', { className: "font-bold uppercase text-white tracking-wider" }, name),
                React.createElement('span', { className: "font-mono text-white" }, `${Math.max(0, Math.ceil(health))}/${maxHealth}`)
            ),
            React.createElement('div', { className: "w-full bg-gray-700 rounded-full h-4 border border-black/50" },
                React.createElement('div', {
                    className: `h-full rounded-full transition-all duration-300 ${isPlayer ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`,
                    style: { width: `${(Math.max(0, health) / maxHealth) * 100}%` }
                })
            )
        )
    );
}

// export default HealthBar;
