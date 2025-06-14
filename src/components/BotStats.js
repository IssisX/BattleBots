import React from 'react';
import { Heart, Weight, Coins, Shield as ShieldIcon } from 'lucide-react'; // Renamed Shield to ShieldIcon

export function BotStats({ bot, StatBarComponent }) {
    if (!StatBarComponent) {
        // console.warn("BotStats: StatBarComponent is undefined");
        return null; // Or some fallback UI
    }

    return (
        React.createElement('div', { className: "w-full bg-black/80 backdrop-blur-md p-4 rounded-lg border border-cyan-400/20" },
            React.createElement('h2', {
                className: "text-xl font-bold text-center uppercase tracking-widest border-b-2 border-cyan-400/50 pb-2 mb-4",
                style: { fontFamily: "'Orbitron', sans-serif" }
            }, bot?.name || "Bot Stats"),
            bot ? (React.createElement('div', { className: "space-y-4" },
                React.createElement(StatBarComponent, {
                    label: "Health",
                    value: bot.stats.maxHealth,
                    max: 500, // Max value for health bar display, can be dynamic later
                    icon: React.createElement(Heart, {size: 16}),
                    colorClass: "from-green-400 to-cyan-500"
                }),
                React.createElement(StatBarComponent, {
                    label: "Weight",
                    value: bot.stats.weight,
                    max: 120, // Max value for weight bar display
                    icon: React.createElement(Weight, {size: 16}),
                    colorClass: "from-orange-400 to-red-500"
                }),
                React.createElement(StatBarComponent, {
                    label: "Cost",
                    value: bot.stats.cost,
                    max: 5000, // Max value for cost bar display
                    icon: React.createElement(Coins, {size: 16}),
                    colorClass: "from-yellow-400 to-orange-500"
                }),
                React.createElement(StatBarComponent, {
                    label: "Armor",
                    value: bot.stats.armor,
                    max: 200, // Max value for armor bar display
                    icon: React.createElement(ShieldIcon, {size: 16}),
                    colorClass: "from-blue-400 to-purple-500"
                })
                // Could add Energy and Energy Regen here later if StatBar is suitable
            )) : React.createElement('p', { className: "text-center text-gray-400" }, "No bot loaded.")
        )
    );
}

// export default BotStats;
