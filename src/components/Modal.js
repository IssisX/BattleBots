import React from 'react';

export function Modal({ modal, onConfirm, onCancel }) {
    if (!modal || !modal.isOpen) return null;
    return (
        React.createElement('div', { className: "absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" },
            React.createElement('div', { className: "bg-gray-900 border-2 border-cyan-400/50 rounded-2xl p-8 max-w-lg w-full shadow-2xl shadow-cyan-500/20" },
                React.createElement('h2', { className: "text-2xl font-bold text-white mb-4", style: { fontFamily: "'Orbitron', sans-serif" } }, modal.title),
                React.createElement('div', { className: "text-gray-300" }, modal.content),
                React.createElement('div', { className: "flex justify-end gap-4 mt-6" },
                    onCancel && React.createElement('button', { onClick: onCancel, className: "menu-button bg-gray-600" }, "Cancel"),
                    onConfirm && React.createElement('button', { onClick: onConfirm, className: "menu-button bg-cyan-500" }, "Confirm")
                )
            )
        )
    );
}

// Default export for convenience if this file only has one main component
// export default Modal; // Can be added if preferred, but named export is fine.
