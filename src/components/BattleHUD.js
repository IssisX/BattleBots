import React from 'react';
import { Timer } from 'lucide-react';

export function BattleHUD({ battleState, onExit, HealthBarComponent, EnergyBarComponent }) {
    if (!battleState || !battleState.player || !battleState.enemy || !HealthBarComponent || !EnergyBarComponent) {
        // console.warn("BattleHUD: Missing critical props", { battleState, HealthBarComponent, EnergyBarComponent });
        return null; // Or some fallback UI indicating an error or loading state
    }

    // Ensure stats objects exist before trying to access maxEnergy
    const playerMaxEnergy = battleState.player.stats ? battleState.player.stats.maxEnergy : 0;
    const enemyMaxEnergy = battleState.enemy.stats ? battleState.enemy.stats.maxEnergy : 0;


    return (
        React.createElement('div', { className: "absolute inset-0 p-4 pointer-events-none flex flex-col justify-between" },
            React.createElement('div', { className: "flex flex-col md:flex-row justify-center gap-4" },
                // Player Bars
                React.createElement('div', {className: "flex flex-col gap-2 w-full md:w-auto"}, // Ensure bars stack nicely on mobile
                    React.createElement(HealthBarComponent, {
                        name: battleState.player.name,
                        health: battleState.player.health,
                        maxHealth: battleState.player.maxHealth,
                        isPlayer: true
                    }),
                    React.createElement(EnergyBarComponent, {
                        name: battleState.player.name,
                        energy: battleState.player.currentEnergy,
                        maxEnergy: playerMaxEnergy, // Use guarded value
                        isPlayer: true
                    })
                ),
                // Enemy Bars
                React.createElement('div', {className: "flex flex-col gap-2 w-full md:w-auto"}, // Ensure bars stack nicely on mobile
                    React.createElement(HealthBarComponent, {
                        name: battleState.enemy.name,
                        health: battleState.enemy.health,
                        maxHealth: battleState.enemy.maxHealth,
                        isPlayer: false
                    }),
                    React.createElement(EnergyBarComponent, {
                        name: battleState.enemy.name,
                        energy: battleState.enemy.currentEnergy,
                        maxEnergy: enemyMaxEnergy, // Use guarded value
                        isPlayer: false
                    })
                )
            ),

            battleState.message && (
                React.createElement('div', { className: "absolute inset-0 flex items-center justify-center" },
                    React.createElement('div', { className: "text-center bg-black/80 p-8 rounded-xl backdrop-blur-sm" },
                        React.createElement('h2', { className: "text-6xl font-black text-white", style: { fontFamily: "'Orbitron', sans-serif" } }, battleState.message),
                        battleState.winner && React.createElement('button', { onClick: onExit, className: "mt-4 menu-button bg-cyan-500 pointer-events-auto" }, "Back to Builder")
                    )
                )
            ),

            React.createElement('div', { className: "flex justify-between items-end" },
                React.createElement('button', { onClick: onExit, className: "menu-button bg-gray-700/80 pointer-events-auto" }, "Exit"),
                React.createElement('div', { className: "flex items-center gap-2 p-3 rounded-lg bg-black/70 border-2 border-gray-600" },
                    React.createElement(Timer, { className: "text-yellow-400" }),
                    React.createElement('span', { className: "text-3xl text-white font-mono", style: { textShadow: '0 0 5px #facc15' } },
                        battleState.timer != null ? battleState.timer.toFixed(1) : '0.0' // Guard timer display
                    )
                )
            )
        )
    );
}

// export default BattleHUD;
