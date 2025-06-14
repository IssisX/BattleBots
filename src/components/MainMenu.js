import React from 'react';
import { Wrench, Bot } from 'lucide-react';

export function MainMenu({ onStartBuilder, onOpenGarage }) {
    return (
        React.createElement('div', { className: "absolute inset-0 flex items-center justify-center p-4" },
            React.createElement('div', { className: "w-full max-w-md text-center bg-black/80 backdrop-blur-md p-8 md:p-12 rounded-2xl border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/20" },
                React.createElement('h1', { className: "text-5xl md:text-6xl font-bold mb-2 uppercase", style: { fontFamily: "'Orbitron', sans-serif" } },
                    React.createElement('span', { className: "bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text" }, "Battle Bots"),
                    React.createElement('span', { className: "text-white" }, " 3D")
                ),
                React.createElement('p', { className: "text-lg text-gray-400 mb-10 font-light" }, "ULTIMATE COMBAT ARENA"),
                React.createElement('div', { className: "space-y-4" },
                    React.createElement('button', { onClick: onStartBuilder, className: "w-full menu-button bg-gradient-to-r from-cyan-500 to-blue-500" },
                        React.createElement(Wrench, { className: "inline-block mr-2" }), " New Bot"
                    ),
                    React.createElement('button', { onClick: onOpenGarage, className: "w-full menu-button bg-gradient-to-r from-purple-500 to-pink-500" },
                        React.createElement(Bot, { className: "inline-block mr-2" }), " Garage"
                    )
                )
            )
        )
    );
}

// export default MainMenu;
