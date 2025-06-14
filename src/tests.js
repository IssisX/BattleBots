// Unit test functions - to be called from console via window.runAllGameLogicTests()
// These functions depend on ALL_PARTS and calculateBotStats from gameLogic.js
// In a real module setup, these would be imported. For now, assume they are made available
// to the scope where runAllGameLogicTests is called, or pass them in.

// Placeholder for making gameLogic available to tests if not importing directly
let testScopeGameLogic = {
    ALL_PARTS: {},
    calculateBotStats: () => ({ maxEnergy: 0, energyRegen: 0 }) // Default mock
};

export function setTestScopeGameLogic(gameLogic) {
    testScopeGameLogic.ALL_PARTS = gameLogic.ALL_PARTS;
    testScopeGameLogic.calculateBotStats = gameLogic.calculateBotStats;
}

export function runAllGameLogicTests() {
    console.log("--- Starting Game Logic Tests ---");
    let testsPassed = 0;
    let testsFailed = 0;

    const assertEqual = (actual, expected, message) => {
        if (actual === expected) {
            console.log(`%cPASS: ${message}`, "color: green;");
            testsPassed++;
        } else {
            console.error(`FAIL: ${message}. Expected: ${expected}, Got: ${actual}`);
            testsFailed++;
        }
    };

    const assertTrue = (condition, message) => {
        if (condition) {
            console.log(`%cPASS: ${message}`, "color: green;");
            testsPassed++;
        } else {
            console.error(`FAIL: ${message}. Condition was false.`);
            testsFailed++;
        }
    };

    const assertFalse = (condition, message) => {
        if (!condition) {
            console.log(`%cPASS: ${message}`, "color: green;");
            testsPassed++;
        } else {
            console.error(`FAIL: ${message}. Condition was true.`);
            testsFailed++;
        }
    };

    // --- Test Cases ---
    // Ensure PART_DEFINITIONS is also available if tests need it directly, or just rely on ALL_PARTS
    if (Object.keys(testScopeGameLogic.ALL_PARTS).length === 0) {
        console.error("CRITICAL FAIL: ALL_PARTS not loaded for tests. Aborting tests. Call setTestScopeGameLogic(gameLogic) first.");
        return;
    }

    testCalculateBotStats(assertEqual, assertTrue, testScopeGameLogic);
    testEnergyMechanics(assertEqual, assertTrue, testScopeGameLogic);
    testShieldMechanics(assertEqual, assertTrue, assertFalse, testScopeGameLogic);
    // --- End Test Cases ---

    console.log("--- Test Summary ---");
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`%cPassed: ${testsPassed}`, "color: green;");
    if (testsFailed > 0) {
        console.error(`Failed: ${testsFailed}`);
    } else {
        console.log("All tests passed!");
    }
    console.log("----------------------");
}

function testCalculateBotStats(assertEqual, assertTrue, gameLogic) {
    const { ALL_PARTS, calculateBotStats } = gameLogic;
    console.log("-- Testing calculateBotStats --");

    const lightChassisDef = ALL_PARTS['chassis_light'];
    if (!lightChassisDef) { console.error("FAIL: chassis_light definition missing for test."); testsFailed++; return; }

    const mediumChassisDef = ALL_PARTS['chassis_medium'];
    if (!mediumChassisDef) { console.error("FAIL: chassis_medium definition missing for test."); testsFailed++; return; }

    let parts1 = [{ key: 'chassis_light' }];
    let stats1 = calculateBotStats(parts1);
    assertEqual(stats1.maxEnergy, lightChassisDef.energyOutput, "Max energy for light chassis");
    assertEqual(stats1.energyRegen, lightChassisDef.energyOutput / 10, "Energy regen for light chassis");

    let parts2 = [{ key: 'chassis_medium' }, { key: 'weapon_saw' }];
    let stats2 = calculateBotStats(parts2);
    assertEqual(stats2.maxEnergy, mediumChassisDef.energyOutput, "Max energy for medium chassis with weapon");
    assertEqual(stats2.energyRegen, mediumChassisDef.energyOutput / 10, "Energy regen for medium chassis");

    let partsNoEnergy = [{key: 'weapon_saw'}];
    let statsNoEnergy = calculateBotStats(partsNoEnergy);
    assertEqual(statsNoEnergy.maxEnergy, 0, "Max energy for bot with no energy producing parts");
    assertEqual(statsNoEnergy.energyRegen, 0, "Energy regen for bot with no energy producing parts");
}

function testEnergyMechanics(assertEqual, assertTrue, gameLogic) {
    const { ALL_PARTS } = gameLogic;
    console.log("-- Testing Energy Mechanics (Simulated) --");

    const flipperDef = ALL_PARTS['weapon_flipper'];
    if(!flipperDef) { console.error("FAIL: weapon_flipper definition missing for test."); testsFailed++; return; }

    let mockBot = {
        currentEnergy: 50,
        stats: { maxEnergy: 100, energyRegen: 10 },
    };

    mockBot.currentEnergy -= flipperDef.energyCost;
    assertEqual(mockBot.currentEnergy, 30, "Energy after flipper use (50 - 20 = 30)");

    let delta = 1;
    mockBot.currentEnergy += mockBot.stats.energyRegen * delta;
    mockBot.currentEnergy = Math.min(mockBot.currentEnergy, mockBot.stats.maxEnergy);
    assertEqual(mockBot.currentEnergy, 40, "Energy after 1s regeneration (30 + 10 = 40)");

    mockBot.currentEnergy = 95;
    mockBot.currentEnergy += mockBot.stats.energyRegen * delta;
    mockBot.currentEnergy = Math.min(mockBot.currentEnergy, mockBot.stats.maxEnergy);
    assertEqual(mockBot.currentEnergy, 100, "Energy regeneration capped at maxEnergy (95 + 10 = 100)");

    mockBot.currentEnergy = 5;
    let canAfford = mockBot.currentEnergy >= flipperDef.energyCost;
    assertFalse(canAfford, "Cannot afford weapon if energy is too low (5 < 20)");
    if (canAfford) { mockBot.currentEnergy -= flipperDef.energyCost; }
    assertEqual(mockBot.currentEnergy, 5, "Energy unchanged if weapon cannot be afforded");

    mockBot.currentEnergy = 5;
    mockBot.currentEnergy -= flipperDef.energyCost;
    mockBot.currentEnergy = Math.max(0, mockBot.currentEnergy);
    assertEqual(mockBot.currentEnergy, 0, "Energy consumption floored at 0 (direct subtraction)");
}

function testShieldMechanics(assertEqual, assertTrue, assertFalse, gameLogic) {
    const { ALL_PARTS } = gameLogic;
    console.log("-- Testing Shield Mechanics (Simulated) --");

    const shieldDef = ALL_PARTS['utility_shield_small'];
    if(!shieldDef) { console.error("FAIL: utility_shield_small definition missing for test."); testsFailed++; return; }

    let mockPlayer = {
        health: 100, maxHealth: 100, currentEnergy: 50,
        stats: { maxEnergy: 100, energyRegen: 10 },
        shieldState: {
            isActive: false, currentHealth: shieldDef.shieldHealthMax,
            maxHealth: shieldDef.shieldHealthMax, regenerationDelayTimer: 0,
            definition: shieldDef
        }
    };

    const applyDamage = (bot, amount) => {
        if (bot.shieldState?.isActive && bot.shieldState.currentHealth > 0) {
            const damageToShield = Math.min(amount, bot.shieldState.currentHealth);
            bot.shieldState.currentHealth -= damageToShield;
            amount -= damageToShield;
            if (bot.shieldState.currentHealth <= 0) {
                bot.shieldState.isActive = false;
                bot.shieldState.regenerationDelayTimer = bot.shieldState.definition.regenerationDelay;
            }
        }
        if (amount > 0) bot.health -= amount;
    };

    assertTrue(mockPlayer.currentEnergy >= shieldDef.energyCostToActivate, "Player has enough energy to activate shield (50 >= 15)");
    mockPlayer.currentEnergy -= shieldDef.energyCostToActivate;
    mockPlayer.shieldState.isActive = true;
    assertEqual(mockPlayer.currentEnergy, 35, "Energy after shield activation (50 - 15 = 35)");
    assertTrue(mockPlayer.shieldState.isActive, "Shield is active");

    applyDamage(mockPlayer, 30);
    assertEqual(mockPlayer.shieldState.currentHealth, shieldDef.shieldHealthMax - 30, "Shield health after 30 damage (75 - 30 = 45)");
    assertEqual(mockPlayer.health, 100, "Player health unchanged after 30 damage to shield");

    applyDamage(mockPlayer, 50);
    assertEqual(mockPlayer.shieldState.currentHealth, 0, "Shield health after breaking (45 - 50 -> 0)");
    assertFalse(mockPlayer.shieldState.isActive, "Shield is inactive after breaking");
    assertEqual(mockPlayer.health, 95, "Player health takes remaining 5 damage (100 - 5 = 95)");

    mockPlayer.health = 100; mockPlayer.shieldState.currentHealth = 0; mockPlayer.shieldState.isActive = false;
    mockPlayer.shieldState.regenerationDelayTimer = shieldDef.regenerationDelay;
    let delta = 1;
    for(let i=0; i < shieldDef.regenerationDelay; i++) { if (mockPlayer.shieldState.regenerationDelayTimer > 0) mockPlayer.shieldState.regenerationDelayTimer -= delta; }
    assertEqual(mockPlayer.shieldState.regenerationDelayTimer, 0, "Regeneration delay timer finished");

    for(let i=0; i < 2; i++) {
        if (mockPlayer.shieldState.regenerationDelayTimer <= 0 && mockPlayer.shieldState.currentHealth < mockPlayer.shieldState.maxHealth) {
             mockPlayer.shieldState.currentHealth += shieldDef.regenerationRate * delta;
             mockPlayer.shieldState.currentHealth = Math.min(mockPlayer.shieldState.currentHealth, mockPlayer.shieldState.maxHealth);
        }
    }
    assertEqual(mockPlayer.shieldState.currentHealth, shieldDef.regenerationRate * 2, "Shield health after 2s regeneration (0 + 10*2 = 20)");

    mockPlayer.shieldState.currentHealth = shieldDef.shieldHealthMax; mockPlayer.shieldState.isActive = true; mockPlayer.currentEnergy = 12;
    if(mockPlayer.shieldState.isActive) mockPlayer.currentEnergy -= shieldDef.energyDrainPerSecond * delta;
    assertEqual(mockPlayer.currentEnergy, 7, "Energy after 1s shield drain (12 - 5 = 7)");

    if(mockPlayer.shieldState.isActive) mockPlayer.currentEnergy -= shieldDef.energyDrainPerSecond * delta;
    assertEqual(mockPlayer.currentEnergy, 2, "Energy after 2s shield drain (7 - 5 = 2)");

    if (mockPlayer.currentEnergy < shieldDef.energyDrainPerSecond * delta && mockPlayer.shieldState.isActive) { mockPlayer.shieldState.isActive = false; }
    assertFalse(mockPlayer.shieldState.isActive, "Shield deactivates due to insufficient energy for drain (2 < 5)");
    assertEqual(mockPlayer.currentEnergy, 2, "Energy remains 2 as drain did not happen");
}

// To make this runnable from console via index.js or App.js:
// window.runAllGameLogicTests = runAllGameLogicTests;
// window.setTestScopeGameLogic = setTestScopeGameLogic;
