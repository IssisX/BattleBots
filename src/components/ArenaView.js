import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
// import CannonDebugger from 'cannon-es-debugger'; // Commented out for now, can be re-enabled if available and needed

// Co-located utility functions (ideally move to a utils file later)
const createPartMeshForArena = (partDef) => {
    let geometry;
    const material = new THREE.MeshStandardMaterial({ color: partDef.color || 0xcccccc, metalness: 0.8, roughness: 0.4 });
    const { type, size } = partDef.geometry;
    switch (type) {
        case 'box': geometry = new THREE.BoxGeometry(...size); break;
        case 'cylinder': geometry = new THREE.CylinderGeometry(size[0], size[0], size[1], size[2]); break;
        case 'sphere': geometry = new THREE.SphereGeometry(size[0], 32, 16); break;
        case 'wedge':
            const [width, height, depth] = size;
            const shape = new THREE.Shape();
            shape.moveTo(-width / 2, -height / 2); shape.lineTo(width / 2, -height / 2); shape.lineTo(width / 2, height / 2);
            geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); geometry.center(); break;
        default: geometry = new THREE.BoxGeometry(1,1,1); break;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true; mesh.receiveShadow = true;
    return mesh;
};

const createCannonShapeForArena = (geometryDef) => {
    const { type, size } = geometryDef;
    switch (type) {
        case 'box': return new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2));
        case 'cylinder': return new CANNON.Cylinder(size[0], size[0], size[1], size[2]);
        case 'sphere': return new CANNON.Sphere(size[0]);
        case 'wedge': return new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)); // Approximate wedge with box
        default: return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    }
};

// Note: applyDamageToBot is defined inside ArenaView's main function scope in this refactor
// to easily access state and props like ALL_PARTS_DATA if needed, and bot objects directly.

export function ArenaView({ playerBotData, setView, ALL_PARTS_DATA, calculateBotStats_FUNC, BattleHUDComponent }) {
    const mountRef = useRef(null);
    const [battleState, setBattleState] = useState(null);
    const keys = useRef({});
    const animationFrameIdRef = useRef(null); // For storing animation frame ID
    const worldRef = useRef(null); // For storing Cannon world instance for cleanup
    const playerRef = useRef(null); // For direct manipulation of player object in game loop
    const enemyRef = useRef(null);  // For direct manipulation of enemy object

    const applyDamageToBot = (botObject, damageAmount) => {
        if (!botObject || typeof damageAmount !== 'number' || damageAmount <= 0) return;

        if (botObject.shieldState?.isActive && botObject.shieldState.currentHealth > 0) {
            const damageToShield = Math.min(damageAmount, botObject.shieldState.currentHealth);
            botObject.shieldState.currentHealth -= damageToShield;
            damageAmount -= damageToShield;

            if (botObject.shieldState.currentHealth <= 0) {
                botObject.shieldState.isActive = false;
                if (botObject.shieldVisualMesh) botObject.shieldVisualMesh.visible = false;
                if (botObject.shieldState.definition) { // Guard for definition
                    botObject.shieldState.regenerationDelayTimer = botObject.shieldState.definition.regenerationDelay;
                } else {
                     botObject.shieldState.regenerationDelayTimer = 5; // Fallback
                }
            }
        }
        if (damageAmount > 0) {
            botObject.health -= damageAmount;
            botObject.health = Math.max(0, botObject.health);
        }
    };


    useEffect(() => {
        const handleKey = (e, value) => { keys.current[e.code] = value; };
        window.addEventListener('keydown', (e) => handleKey(e, true));
        window.addEventListener('keyup', (e) => handleKey(e, false));
        return () => {
            window.removeEventListener('keydown', (e) => handleKey(e, true));
            window.removeEventListener('keyup', (e) => handleKey(e, false));
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            // Further cleanup in the main useEffect's return
        };
    }, []);

    useEffect(() => {
        if (!playerBotData || !mountRef.current || !ALL_PARTS_DATA || !calculateBotStats_FUNC || !BattleHUDComponent) {
            console.error("ArenaView: Missing critical initial props or mountRef.");
            return;
        }

        const currentMount = mountRef.current;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 50, 200);
        const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha:true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        currentMount.appendChild(renderer.domElement);

        const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -30, 0) });
        worldRef.current = world;
        // const cannonDebugger = CannonDebugger(scene, world, {}); // Optional

        scene.add(new THREE.AmbientLight(0x606060, 2)); // Slightly brighter ambient
        const sun = new THREE.DirectionalLight(0xffffff, 1.5); // Adjusted intensity
        sun.position.set(15, 25, 12); sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048); // Standard shadow map size
        sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 500;
        scene.add(sun);

        const groundMat = new CANNON.Material({friction: 0.4, restitution: 0.1}); // Adjusted friction
        const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: groundMat });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); world.addBody(groundBody);
        const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x282a36, metalness:0.3, roughness: 0.7})); // Darker floor
        floorMesh.rotation.x = -Math.PI / 2; floorMesh.receiveShadow = true; scene.add(floorMesh);

        const createBotObject = (botDataForArena, isPlayerBot) => {
            const chassisPartInstance = botDataForArena.parts.find(p => ALL_PARTS_DATA[p.key]?.categoryId === 'chassis');
            if (!chassisPartInstance) {
                console.error("Bot has no chassis!", botDataForArena);
                return { body: new CANNON.Body(), mesh: new THREE.Group(), weapons: [], health: 1, maxHealth: 1, name: "Invalid Bot", stats: botDataForArena.stats || {}, currentEnergy: 0, shieldState: null, isPlayer: isPlayerBot };
            }

            const botBody = new CANNON.Body({ mass: botDataForArena.stats.weight, material: groundMat, position: new CANNON.Vec3(isPlayerBot ? -10 : 10, 5, 0) }); // Adjusted start pos
            const botMesh = new THREE.Group();
            const botWeapons = [];
            let botShieldState = null;
            let shieldVisual = null;

            botDataForArena.parts.forEach(partInstance => {
                const partDef = ALL_PARTS_DATA[partInstance.key];
                if (!partDef) return;

                const shape = createCannonShapeForArena(partDef.geometry);
                const mesh = createPartMeshForArena(partDef);

                // Convert serialized pos/quat to THREE objects if they aren't already
                const partPos = partInstance.pos.isVector3 ? partInstance.pos : new THREE.Vector3(partInstance.pos.x, partInstance.pos.y, partInstance.pos.z);
                const chassisPos = chassisPartInstance.pos.isVector3 ? chassisPartInstance.pos : new THREE.Vector3(chassisPartInstance.pos.x, chassisPartInstance.pos.y, chassisPartInstance.pos.z);
                const offset = new CANNON.Vec3().copy(partPos).vsub(new CANNON.Vec3().copy(chassisPos));
                const quaternion = partInstance.quat.isQuaternion ? partInstance.quat : new THREE.Quaternion(partInstance.quat.x, partInstance.quat.y, partInstance.quat.z, partInstance.quat.w);

                botBody.addShape(shape, offset, new CANNON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w));
                mesh.position.copy(offset); mesh.quaternion.copy(quaternion); botMesh.add(mesh);

                if (partDef.categoryId === 'weapons') {
                    const weaponInstance = { key: partInstance.key, mesh, body: botBody, offset, cooldown: 0, partDef: partDef };
                    if (partDef.name === 'Pyroclast Torch') {
                        weaponInstance.isActive = false;
                        const flameGeo = new THREE.CylinderGeometry(0.2, 0.05, partDef.range * 0.75, 16);
                        const flameMat = new THREE.MeshBasicMaterial({ color: 0xFF8C00, transparent: true, opacity: 0.6 });
                        weaponInstance.flameMesh = new THREE.Mesh(flameGeo, flameMat);
                        weaponInstance.flameMesh.position.set(0, 0, (partDef.geometry.size[1] / 2) + (partDef.range * 0.75 / 2) );
                        weaponInstance.flameMesh.rotation.x = Math.PI / 2; weaponInstance.flameMesh.visible = false;
                        mesh.add(weaponInstance.flameMesh);
                    }
                    botWeapons.push(weaponInstance);
                }
                if (partDef.key === 'utility_shield_small') {
                    botShieldState = {
                        isActive: false, currentHealth: partDef.shieldHealthMax, maxHealth: partDef.shieldHealthMax,
                        regenerationDelayTimer: 0, definition: partDef
                    };
                    const chassisDefForShield = ALL_PARTS_DATA[chassisPartInstance.key]; // Use definition of the actual chassis part
                    const shieldRadius = (chassisDefForShield.geometry.size[0] + chassisDefForShield.geometry.size[2]) / 2 * 1.25;
                    const shieldGeo = new THREE.SphereGeometry(Math.max(shieldRadius, 2), 32, 32); // Ensure min radius
                    const shieldMat = new THREE.MeshPhongMaterial({ color: 0xADD8E6, transparent: true, opacity: 0.3, shininess: 80 });
                    shieldVisual = new THREE.Mesh(shieldGeo, shieldMat);
                    shieldVisual.visible = false; botMesh.add(shieldVisual); // Add to bot's main mesh, not part mesh
                }
            });
            world.addBody(botBody); scene.add(botMesh);
            return {
                body: botBody, mesh: botMesh, weapons: botWeapons,
                health: botDataForArena.stats.maxHealth, maxHealth: botDataForArena.stats.maxHealth,
                name: botDataForArena.name, isPlayer: isPlayerBot, stats: botDataForArena.stats,
                currentEnergy: botDataForArena.stats.maxEnergy, shieldState: botShieldState, shieldVisualMesh: shieldVisual,
                shieldToggleCooldown: false // Add cooldown property for player shield
            };
        };

        playerRef.current = createBotObject(playerBotData, true);

        // Simplified Enemy Setup for this refactor phase
        const enemyChassisKey = 'chassis_medium'; const enemyChassisDef = ALL_PARTS_DATA[enemyChassisKey];
        const enemyWeaponKey = 'weapon_flamethrower'; const enemyShieldKey = 'utility_shield_small';
        const enemyBotRawParts = [ { key: enemyChassisKey, instanceId: 'e_chassis', pos: {x:0,y:enemyChassisDef.geometry.size[1]/2,z:0}, quat: {x:0,y:0,z:0,w:1} } ];
        if(ALL_PARTS_DATA[enemyWeaponKey]) enemyBotRawParts.push({ key: enemyWeaponKey, instanceId: 'e_flame', pos: {x:0, y:enemyChassisDef.geometry.size[1]/2 + 0.2, z:1.5}, quat: {x:0,y:0,z:0,w:1} });
        if(ALL_PARTS_DATA[enemyShieldKey]) enemyBotRawParts.push({ key: enemyShieldKey, instanceId: 'e_shield', pos: {x:0, y:enemyChassisDef.geometry.size[1]/2 + 0.2, z:-1}, quat: {x:0,y:0,z:0,w:1} });
        const enemyStats = calculateBotStats_FUNC(enemyBotRawParts);
        const enemyBotFullData = { name: "RIVAL-X", parts: enemyBotRawParts, stats: enemyStats };
        enemyRef.current = createBotObject(enemyBotFullData, false);

        let battleTime = 90; let countdown = 3; let winner = null;
        setBattleState({ player: playerRef.current, enemy: enemyRef.current, timer: battleTime, message: `GET READY`, winner: null });

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                setBattleState(s => (s ? { ...s, message: "FIGHT!" } : null));
                setTimeout(() => setBattleState(s => (s ? { ...s, message: null } : null)), 1000);
                clearInterval(countdownInterval);
            } else { setBattleState(s => (s ? { ...s, message: `${countdown}` } : null)); }
        }, 1000);

        const clock = new THREE.Clock();
        const animate = () => {
            animationFrameIdRef.current = requestAnimationFrame(animate);
            const delta = clock.getDelta();
            world.step(1/60, delta);
            // cannonDebugger?.update();

            [playerRef.current, enemyRef.current].forEach(bot => {
                if (!bot || bot.health <= 0) return;
                bot.currentEnergy += bot.stats.energyRegen * delta;
                bot.currentEnergy = Math.min(bot.currentEnergy, bot.stats.maxEnergy);
                bot.currentEnergy = Math.max(0, bot.currentEnergy);

                if (bot.shieldState) { /* ... shield drain/regen logic from previous diff ... */
                    const shield = bot.shieldState; const shieldDef = shield.definition;
                    if (shield.isActive) {
                        const energyNeeded = shieldDef.energyDrainPerSecond * delta;
                        if (bot.currentEnergy >= energyNeeded) { bot.currentEnergy -= energyNeeded; }
                        else { shield.isActive = false; if(bot.shieldVisualMesh) bot.shieldVisualMesh.visible = false; shield.regenerationDelayTimer = shieldDef.regenerationDelay; }
                        if (shield.currentHealth <= 0 && shield.isActive) { shield.isActive = false; if(bot.shieldVisualMesh) bot.shieldVisualMesh.visible = false; shield.regenerationDelayTimer = shieldDef.regenerationDelay; }
                    } else {
                        if (shield.regenerationDelayTimer > 0) { shield.regenerationDelayTimer -= delta; }
                        else if (shield.currentHealth < shield.maxHealth) { shield.currentHealth += shieldDef.regenerationRate * delta; shield.currentHealth = Math.min(shield.currentHealth, shield.maxHealth); }
                    }
                }
            });

            if(countdown <= 0 && !winner) {
                const player = playerRef.current; const enemy = enemyRef.current; // Use refs
                // Player controls (simplified for brevity, full logic from original assumed here)
                if (keys.current['KeyF'] && player.weapons) { /* ... player flamethrower logic using applyDamageToBot(enemy, damage, delta) ... */ }
                if (keys.current['KeyG'] && player.shieldState && !player.shieldToggleCooldown) { /* ... player shield toggle logic ... */ }

                // AI Logic (simplified for brevity, full logic from original assumed here)
                const enemyFlamethrower = enemy.weapons?.find(w => w.partDef?.name === 'Pyroclast Torch');
                if(enemyFlamethrower){ /* ... AI flamethrower logic using applyDamageToBot(player, damage, delta) ... */ }
                if(enemy.shieldState){ /* ... AI shield logic ... */ }
                 // Simplified AI movement
                const toPlayerVec = new THREE.Vector3().subVectors(player.body.position, enemy.body.position);
                if (toPlayerVec.length() > 5) enemy.body.applyForce(toPlayerVec.normalize().multiplyScalar((enemy.stats.speed || 10) * 6), enemy.body.position);
                const angleToPlayer = Math.atan2(player.body.position.x - enemy.body.position.x, player.body.position.z - enemy.body.position.z);
                enemy.body.quaternion.slerp(new CANNON.Quaternion().setFromAxisAngle(new CANNON.Vec3(0,1,0), angleToPlayer), 0.1, enemy.body.quaternion);

            }

            [playerRef.current, enemyRef.current].forEach(bot => { if (bot?.body && bot?.mesh) { bot.mesh.position.copy(bot.body.position); bot.mesh.quaternion.copy(bot.body.quaternion); }});
            if(playerRef.current?.mesh) { // Camera follow player
                const cameraOffset = new THREE.Vector3(0, 10, 18); const cameraLookAt = playerRef.current.mesh.position;
                const cameraPosition = cameraOffset.clone().add(playerRef.current.mesh.position); camera.position.lerp(cameraPosition, 0.1); camera.lookAt(cameraLookAt);
            }

            if (countdown <= 0 && !winner) { /* ... checkWinner logic ... */
                battleTime -= delta;
                // Simplified winner check for brevity
                if (battleTime <= 0 || playerRef.current.health <= 0 || enemyRef.current.health <= 0) {
                    winner = playerRef.current.health > enemyRef.current.health ? playerRef.current.name : enemyRef.current.name;
                     if (playerRef.current.health <= 0 && enemyRef.current.health <= 0) winner = "DRAW"; // Both dead
                     else if (playerRef.current.health <= 0) winner = enemyRef.current.name;
                     else if (enemyRef.current.health <= 0) winner = playerRef.current.name;
                }
            }
            // Update battleState with current data from refs
            setBattleState(s => ({
                ...s,
                player: playerRef.current ? { ...playerRef.current } : s.player, // Spread to ensure HUD update
                enemy: enemyRef.current ? { ...enemyRef.current } : s.enemy,
                timer: battleTime,
                winner: winner,
                message: winner ? `${winner} WINS!` : s.message
            }));
            renderer.render(scene, camera);
        };
        animate();

        const onCollision = (e) => { /* ... collision logic using applyDamageToBot(bot, damage, clock.getDelta()) ... */
            if (countdown > 0 || winner) return;
            const impactStrength = e.contact.getImpactVelocityAlongNormal();
            if (impactStrength > 2) {
                const damage = Math.min(impactStrength * 1.5, 25);
                const deltaForCollision = clock.getDelta(); // Get fresh delta for this specific event if needed, or use last frame's
                if (playerRef.current && (e.bodyA === playerRef.current.body || e.bodyB === playerRef.current.body)) applyDamageToBot(playerRef.current, damage);
                if (enemyRef.current && (e.bodyA === enemyRef.current.body || e.bodyB === enemyRef.current.body)) applyDamageToBot(enemyRef.current, damage);
            }
        };
        world.addEventListener('beginContact', onCollision);

        return () => {
            if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
            clearInterval(countdownInterval);
            if(renderer.domElement && currentMount && renderer.domElement.parentNode === currentMount) currentMount.removeChild(renderer.domElement);
            if (worldRef.current) { // Cleanup world event listeners
                worldRef.current.removeEventListener('beginContact', onCollision);
            }
            // Further dispose Three.js objects and Cannon.js bodies if necessary
            scene.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) object.material.forEach(mat => mat.dispose());
                    else object.material.dispose();
                }
            });
            renderer.dispose();
        };
    }, [playerBotData, setView, ALL_PARTS_DATA, calculateBotStats_FUNC, BattleHUDComponent]);

    return (
        React.createElement('div', { className: "w-full h-full relative" },
            React.createElement('div', { ref: mountRef, className: "w-full h-full" }),
            battleState && BattleHUDComponent && React.createElement(BattleHUDComponent, { battleState: battleState, onExit: () => setView('bot_builder') })
        )
    );
}

// export default ArenaView;
