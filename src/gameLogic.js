import React from 'react';
// Assuming all icons used in PART_DEFINITIONS are listed here.
// Shield was used for Utility category, Coins, Weight, Heart might be used by StatBar later,
// but for PART_DEFINITIONS directly, it's Square, Swords, Bot, Shield.
import { Square, Swords, Bot, Shield } from 'lucide-react';

export const firebaseConfig = typeof __firebase_config !== 'undefined'
    ? JSON.parse(__firebase_config)
    : {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

export const PART_DEFINITIONS = {
    chassis: {
        id: 'chassis',
        name: 'Chassis',
        icon: React.createElement(Square, { size: 24 }),
        items: {
            chassis_light: { name: 'Light Chassis', weight: 5, cost: 150, armor: 15, health: 80, power: 10, energyOutput: 10, description: 'Fast and agile, perfect for hit-and-run tactics.', geometry: { type: 'box', size: [2, 0.4, 3] }, color: 0x9D9D9D, attachmentPoints: [{ pos: [0, 0.2, 0.8], type: ['weapon', 'utility'] }, { pos: [0, 0.2, -0.8], type: ['utility'] }] },
            chassis_medium: { name: 'Medium Chassis', weight: 12, cost: 300, armor: 30, health: 120, power: 20, energyOutput: 15, description: 'Balanced design for versatile combat.', geometry: { type: 'box', size: [2.5, 0.5, 3.5] }, color: 0x808080, attachmentPoints: [{ pos: [0, 0.25, 1], type: ['weapon'] }, { pos: [0.8, 0.25, -0.5], type: ['utility'] }, { pos: [-0.8, 0.25, -0.5], type: ['utility'] }] },
            chassis_heavy: { name: 'Heavy Chassis', weight: 25, cost: 500, armor: 50, health: 200, power: 15, energyOutput: 20, description: 'Maximum protection and stability.', geometry: { type: 'box', size: [3, 0.6, 4] }, color: 0x6A6A6A, attachmentPoints: [{ pos: [0, 0.3, 1.2], type: ['weapon', 'heavy_weapon'] }, { pos: [1, 0.3, 0], type: ['weapon'] }, { pos: [-1, 0.3, 0], type: ['weapon'] }, { pos: [0, 0.3, -1.2], type: ['utility'] }] },
            chassis_wedge: { name: 'Wedge Chassis', weight: 18, cost: 400, armor: 35, health: 150, power: 18, energyOutput: 12, description: 'Wedge design for getting under opponents.', geometry: { type: 'wedge', size: [2.5, 0.5, 3] }, color: 0x7B7B8F, attachmentPoints: [{ pos: [0, 0.25, 0], type: ['weapon'] }] },
        }
    },
    weapons: {
        id: 'weapons',
        name: 'Weapons',
        icon: React.createElement(Swords, { size: 24 }),
        items: {
            weapon_saw: { name: 'Buzzsaw', type: 'weapon', weight: 8, cost: 400, power: 25, damage: 35, energyCost: 5, description: 'High-speed spinning blade for continuous damage.', geometry: { type: 'cylinder', size: [1.2, 0.1, 16] }, color: 0xAAAAAA },
            weapon_hammer: { name: 'War Hammer', type: 'heavy_weapon', weight: 15, cost: 600, power: 40, damage: 60, energyCost: 25, description: 'Pneumatic hammer for devastating single hits.', geometry: { type: 'box', size: [0.8, 0.8, 0.8] }, color: 0x444444 },
            weapon_flipper: { name: 'Launcher Arm', type: 'weapon', weight: 12, cost: 700, power: 35, damage: 30, energyCost: 20, description: 'Powerful flipper to launch opponents airborne.', geometry: { type: 'box', size: [1.5, 0.2, 2] }, color: 0x5555AA },
            weapon_flamethrower: { name: 'Pyroclast Torch', type: 'weapon', weight: 7, cost: 550, power: 0, damagePerSecond: 15, energyCostPerSecond: 10, range: 8, coneAngle: Math.PI / 8, description: 'Emits a continuous stream of fire, melting armor over time.', geometry: { type: 'cylinder', size: [0.3, 1.5, 8] }, color: 0xFF4500 },
        }
    },
    mobility: {
        id: 'mobility',
        name: 'Mobility',
        icon: React.createElement(Bot, { size: 24 }),
        items: {
            mobility_wheels: { name: 'High-Speed Wheels', type: 'mobility', weight: 3, cost: 120, speed: 25, traction: 0.8, description: 'High-speed wheels for maximum agility.', geometry: { type: 'cylinder', size: [0.5, 0.3, 16] }, color: 0x222222 },
            mobility_treads: { name: 'Tank Treads', type: 'mobility', weight: 8, cost: 200, speed: 15, traction: 1.2, description: 'Tank treads for superior grip and stability.', geometry: { type: 'box', size: [2, 0.4, 0.8] }, color: 0x333333 },
        }
    },
    utility: {
        id: 'utility',
        name: 'Utility',
        icon: React.createElement(Shield, { size: 24 }),
        items: {
            utility_shield_small: { name: 'Aegis Ward', type: 'utility', weight: 6, cost: 450, shieldHealthMax: 75, energyCostToActivate: 15, energyDrainPerSecond: 5, regenerationDelay: 5, regenerationRate: 10, description: 'Generates a temporary energy barrier that absorbs incoming damage.', geometry: { type: 'sphere', size: [0.4] }, color: 0x00BFFF },
        }
    },
};

export const ALL_PARTS = Object.values(PART_DEFINITIONS).reduce((acc, category) => {
    Object.entries(category.items).forEach(([key, value]) => {
        // Add the part key (e.g., 'chassis_light') to the part definition itself for easier access
        acc[key] = { ...value, categoryId: category.id, key: key };
    });
    return acc;
}, {});

export const calculateBotStats = (parts) => {
    const stats = { weight: 0, cost: 0, power: 0, armor: 0, speed: 0, damage: 0, maxHealth: 0, parts: parts.length, maxEnergy: 0, energyRegen: 0 };
    if (!parts || parts.length === 0) return stats;

    let baseHealth = 100;
    let chassisHealth = 0;

    parts.forEach(part => {
        // part.key should be the string key like 'chassis_light', which is now ensured by ALL_PARTS derivation or should be passed correctly
        const def = ALL_PARTS[part.key];
        if (def) {
            stats.weight += def.weight || 0;
            stats.cost += def.cost || 0;
            stats.power += def.power || 0;
            stats.armor += def.armor || 0;
            stats.speed += def.speed || 0;
            // For weapons, direct damage (like hammer) vs damagePerSecond (flamethrower) might need differentiation if 'damage' stat is generic.
            // Current structure adds damage/damagePerSecond directly to stats.damage. This might need refinement later.
            stats.damage += def.damage || def.damagePerSecond || 0;

            if(def.categoryId === 'chassis') {
                chassisHealth += def.health || 0;
                stats.maxEnergy += def.energyOutput || 0;
            }
        } else {
            // console.warn("Part definition not found for key:", part.key); // For debugging
        }
    });
    stats.maxHealth = baseHealth + chassisHealth;
    stats.energyRegen = stats.maxEnergy > 0 ? stats.maxEnergy / 10 : 0; // Ensure no division by zero if maxEnergy is 0
    return stats;
};
