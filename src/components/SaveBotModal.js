import React from 'react';

export function SaveBotModal({ bot, onSave, onCancel }) {
    const botName = bot ? bot.name : "New Bot";
    return (
        React.createElement('div', { className: "space-y-4" },
            React.createElement('p', null, "Enter a name for your bot."),
            React.createElement('input', {
                type: "text",
                defaultValue: botName,
                id: "botNameInput", // Ensure this ID is unique if multiple instances are ever rendered, though typically modals are singular.
                className: "w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            }),
            React.createElement('div', { className: "flex justify-end gap-4 mt-6" },
                React.createElement('button', { onClick: onCancel, className: "menu-button bg-gray-600" }, "Cancel"),
                React.createElement('button', {
                    onClick: () => {
                        const nameInput = document.getElementById('botNameInput');
                        if (nameInput && nameInput.value) onSave(nameInput.value);
                    },
                    className: "menu-button bg-cyan-500"
                }, "Save")
            )
        )
    );
}

// export default SaveBotModal;
