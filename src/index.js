import React from 'react';
import ReactDOM from 'react-dom';

// Import the main App component
import App from './App.js';

// Import game logic and data
import * as gameLogic from './gameLogic.js';

// Import all UI components
import { MainMenu } from './components/MainMenu.js';
import { GarageView } from './components/GarageView.js';
import { BotBuilderView } from './components/BotBuilderView.js';
import { ArenaView } from './components/ArenaView.js';
import { Modal } from './components/Modal.js';
import { SaveBotModal } from './components/SaveBotModal.js';
import { PartCategory } from './components/PartCategory.js';
import { PartPalette } from './components/PartPalette.js';
import { BotStats } from './components/BotStats.js';
import { StatBar } from './components/StatBar.js';
import { HealthBar } from './components/HealthBar.js';
import { EnergyBar } from './components/EnergyBar.js';
import { BattleHUD } from './components/BattleHUD.js';
import { BuilderCanvas } from './components/BuilderCanvas.js';

// Import test functions
import { runAllGameLogicTests, setTestScopeGameLogic } from './tests.js';

// Provide gameLogic to the test scope
setTestScopeGameLogic(gameLogic);

// Expose test runner to the window for manual execution
window.runAllGameLogicTests = runAllGameLogicTests;
console.log("Game logic tests are available. Call window.runAllGameLogicTests() from the console to run them.");


// Bundle components to pass to App
const components = {
    MainMenuComponent: MainMenu,
    GarageViewComponent: GarageView,
    BotBuilderViewComponent: BotBuilderView,
    ArenaViewComponent: ArenaView,
    ModalComponent: Modal,
    SaveBotModalComponent: SaveBotModal,
    PartCategoryComponent: PartCategory,
    PartPaletteComponent: PartPalette,
    BotStatsComponent: BotStats,
    StatBarComponent: StatBar,
    HealthBarComponent: HealthBar,
    EnergyBarComponent: EnergyBar,
    BattleHUDComponent: BattleHUD,
    BuilderCanvasComponent: BuilderCanvas
};

ReactDOM.render(
  React.createElement(React.StrictMode, null,
    React.createElement(App, { gameLogic: gameLogic, components: components })
  ),
  document.getElementById('root')
);
