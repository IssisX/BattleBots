import React from 'react';
import { ArrowLeft, Trash2, Wrench } from 'lucide-react';

export function GarageView({ bots, onLoad, onCreate, onDelete, onBack }) {
    return (
        React.createElement('div', { className: "absolute inset-0 flex items-center justify-center p-4" },
            React.createElement('div', { className: "w-full max-w-2xl text-white bg-black/80 backdrop-blur-md p-8 rounded-2xl border-2 border-purple-400/50 shadow-2xl shadow-purple-500/20" },
                React.createElement('div', { className: "flex justify-between items-center border-b-2 border-purple-400/50 pb-4 mb-4" },
                    React.createElement('button', { onClick: onBack, className: "p-2 rounded-full hover:bg-white/10 transition" },
                        React.createElement(ArrowLeft, { size: 24 })
                    ),
                    React.createElement('h1', { className: "text-4xl font-bold uppercase", style: { fontFamily: "'Orbitron', sans-serif" } }, "Garage"),
                    React.createElement('div', { className: "w-10" }) // Spacer
                ),
                React.createElement('div', { className: "space-y-3 max-h-[60vh] overflow-y-auto pr-2" },
                    bots && bots.length > 0 ? bots.map(bot => ( // Added guard for bots array
                        React.createElement('div', { key: bot.id, className: "flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition" },
                            React.createElement('div', null,
                                React.createElement('h3', { className: "text-xl font-bold" }, bot.name),
                                React.createElement('p', { className: "text-sm text-gray-400" },
                                    `Parts: ${bot.parts ? bot.parts.length : 0}, Weight: ${bot.stats ? bot.stats.weight : 0}` // Guard for bot.parts and bot.stats
                                )
                            ),
                            React.createElement('div', { className: "flex gap-2" },
                                React.createElement('button', { onClick: () => onDelete(bot.id), className: "builder-button bg-red-500/80 hover:bg-red-500" },
                                    React.createElement(Trash2, { size: 16 })
                                ),
                                React.createElement('button', { onClick: () => onLoad(bot.id), className: "builder-button bg-cyan-500/80 hover:bg-cyan-500" }, "Load")
                            )
                        )
                    )) : (
                        React.createElement('p', { className: "text-center text-gray-400 py-8" }, "You have no saved bots. Go create one!")
                    )
                ),
                React.createElement('button', { onClick: onCreate, className: "w-full mt-6 menu-button bg-gradient-to-r from-cyan-500 to-blue-500" },
                    React.createElement(Wrench, { className: "inline-block mr-2" }), " Build a New Bot"
                )
            )
        )
    );
}

// export default GarageView;
