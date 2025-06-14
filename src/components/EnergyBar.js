import React from 'react';

export function EnergyBar({ name, energy, maxEnergy, isPlayer }) {
    // The name prop was previously {name} - ENERGY for player, and just {name} for enemy, but it's better to make it consistent.
    // For now, I'll keep the label simple, it can be prefixed where used if needed.
    const displayName = `${name}${isPlayer ? "" : ""}`; // Removed ' - ENERGY' suffix, can be added by parent

    return (
        React.createElement('div', { className: `w-full max-w-sm p-3 rounded-lg border-2 ${isPlayer ? 'border-yellow-400' : 'border-orange-500'} bg-black/70` },
            React.createElement('div', { className: "flex justify-between items-center mb-1" },
                React.createElement('span', { className: "font-bold uppercase text-white tracking-wider" }, displayName),
                React.createElement('span', { className: "font-mono text-white" }, `${Math.max(0, Math.ceil(energy))}/${maxEnergy}`)
            ),
            React.createElement('div', { className: "w-full bg-gray-700 rounded-full h-4 border border-black/50" },
                React.createElement('div', {
                    className: `h-full rounded-full transition-all duration-300 ${isPlayer ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-orange-500 to-red-600'}`,
                    style: { width: `${(Math.max(0, energy) / maxEnergy) * 100}%` }
                })
            )
        )
    );
}

// export default EnergyBar;
