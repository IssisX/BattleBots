import React, { useState, useRef } from 'react';
import { X, Menu } from 'lucide-react';

// PartPaletteComponent, BuilderCanvasComponent, BotStatsComponent will be passed as props
// ALL_PARTS_DATA and PART_DEFINITIONS_DATA will also be passed as props

export function BotBuilderView({
    bot,
    updateCurrentBot,
    onSave,
    onTest,
    onExit,
    PartPaletteComponent,
    BuilderCanvasComponent,
    BotStatsComponent,
    ALL_PARTS_DATA,
    PART_DEFINITIONS_DATA,
    showModal,
    hideModal,
    // Props for StatBarComponent to be passed to BotStatsComponent
    StatBarComponent
}) {
    const [isPaletteOpen, setPaletteOpen] = useState(true);
    const builderRef = useRef(null); // This ref is for the BuilderCanvasComponent

    const handleClear = () => {
        if (builderRef.current && builderRef.current.clearAllParts) {
            if(window.confirm("Are you sure you want to clear this bot? All unsaved changes will be lost.")) {
                builderRef.current.clearAllParts();
            }
        } else {
            console.warn("BuilderCanvas ref or clearAllParts method not available.");
        }
    };

    // Ensure necessary components are passed as props before attempting to render them
    if (!PartPaletteComponent || !BuilderCanvasComponent || !BotStatsComponent || !StatBarComponent) {
        return React.createElement('div', null, 'Error: Essential UI components are missing.');
    }

    if (!PART_DEFINITIONS_DATA) {
         return React.createElement('div', null, 'Error: Part definitions data is missing.');
    }


    return (
        React.createElement('div', { className: "relative w-full h-full flex flex-col lg:flex-row bg-gray-800 rounded-2xl shadow-2xl overflow-hidden" },
            React.createElement('button', {
                onClick: () => setPaletteOpen(!isPaletteOpen),
                className: "lg:hidden absolute top-4 left-4 z-30 p-2 bg-black/50 backdrop-blur-sm rounded-md text-white"
            },
                isPaletteOpen ? React.createElement(X) : React.createElement(Menu)
            ),
            React.createElement('div', {
                className: `absolute lg:static top-0 left-0 h-full z-20 transition-transform duration-300 ease-in-out w-full max-w-sm lg:w-1/4 lg:max-w-xs ${isPaletteOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`
            },
                // PartPaletteComponent expects PartCategoryComponent to be handled internally or passed to it by App.js
                React.createElement(PartPaletteComponent, {
                    onClear: handleClear,
                    onTest: onTest,
                    onSave: onSave,
                    onExit: onExit,
                    partDefinitionsData: PART_DEFINITIONS_DATA
                })
            ),
            React.createElement('div', { className: "flex-grow h-full w-full relative" },
                React.createElement(BuilderCanvasComponent, {
                    ref: builderRef,
                    bot: bot,
                    updateCurrentBot: updateCurrentBot,
                    ALL_PARTS_DATA: ALL_PARTS_DATA,
                    showModal: showModal,
                    hideModal: hideModal
                })
            ),
            React.createElement('div', { className: "hidden lg:block absolute bottom-4 right-4 z-10 w-80" },
                React.createElement(BotStatsComponent, { bot: bot, StatBarComponent: StatBarComponent })
            ),
            React.createElement('div', { className: "lg:hidden p-2 bg-gray-900" },
                React.createElement(BotStatsComponent, { bot: bot, StatBarComponent: StatBarComponent })
            )
        )
    );
}

// export default BotBuilderView;
