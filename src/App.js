import React, { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three'; // For Vector3, Quaternion in useGame
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, doc, setDoc, query, deleteDoc } from "firebase/firestore"; // Removed addDoc, where as they were not used in the provided hook logic
import { Loader2 } from 'lucide-react';

// Co-locate useGame for this subtask. Later it can be src/hooks/useGame.js
const useGame_HOOK = (gameLogic) => {
    const { firebaseConfig, ALL_PARTS, calculateBotStats } = gameLogic; // PART_DEFINITIONS is not directly used by useGame hook based on provided logic

    const [gameState, setGameState] = useState({
        currentBot: null, savedBots: [], currentView: 'main_menu',
        isLoading: true, modal: { isOpen: false, title: '', content: null }, userId: null
    });
    const [firebaseRefs, setFirebaseRefs] = useState(null);

    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'dev-app'; // Ensure __app_id is handled if it comes from global scope
        setFirebaseRefs({ app, auth, db, appId });

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => { // Store unsubscribe function
            if (user) {
                setGameState(prev => ({ ...prev, userId: user.uid, isLoading: true }));
                // Pass firebaseRefs directly if available, otherwise use db, appId from closure
                await fetchBots(firebaseRefs?.db || db, user.uid, firebaseRefs?.appId || appId);
                // isLoading is set to false inside fetchBots or its error handling
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Error signing in anonymously:", error);
                    setGameState(prev => ({ ...prev, isLoading: false, modal: {isOpen:true, title:'Auth Error', content:'Could not sign in.'} }));
                }
            }
        });
        return () => unsubscribeAuth(); // Cleanup subscription on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firebaseConfig]); // fetchBots will be wrapped in useCallback, so firebaseRefs should be in its deps or passed if it changes

    const fetchBots = useCallback(async (db, userId, appId) => {
        if (!db || !userId || !appId) {
            setGameState(prev => ({ ...prev, isLoading: false, modal: {isOpen:true, title:'Fetch Error', content:'Missing DB parameters for fetching bots.'} }));
            return;
        }
        setGameState(prev => ({ ...prev, isLoading: true }));
        const botsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/bots`);
        const q = query(botsCollectionRef);
        try {
            const querySnapshot = await getDocs(q);
            const bots = querySnapshot.docs.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id, ...data,
                    parts: data.parts.map(p => ({
                        ...p,
                        pos: p.pos && typeof p.pos.toArray === 'function' ? p.pos : new THREE.Vector3().fromArray(p.pos || [0,0,0]),
                        quat: p.quat && typeof p.quat.toArray === 'function' ? p.quat : new THREE.Quaternion().fromArray(p.quat || [0,0,0,1]),
                    }))
                };
            });
            setGameState(prev => ({ ...prev, savedBots: bots, isLoading: false }));
        } catch (error) {
            console.error("Error fetching bots: ", error);
            setGameState(prev => ({ ...prev, isLoading: false, modal: {isOpen:true, title:'Error', content:'Could not fetch bots.'}}));
        }
    }, []);

    const saveCurrentBot = useCallback(async (botName) => {
        if (!firebaseRefs || !gameState.userId || !gameState.currentBot) return;
        setGameState(prev => ({ ...prev, isLoading: true }));
        const botToSave = {
            ...gameState.currentBot, name: botName,
            parts: gameState.currentBot.parts.map(p => ({
                ...p,
                pos: p.pos.toArray ? p.pos.toArray() : [p.pos.x, p.pos.y, p.pos.z],
                quat: p.quat.toArray ? p.quat.toArray() : [p.quat.x, p.quat.y, p.quat.z, p.quat.w],
            })),
            stats: calculateBotStats(gameState.currentBot.parts)
        };
        const docRef = doc(firebaseRefs.db, `artifacts/${firebaseRefs.appId}/users/${gameState.userId}/bots`, botToSave.id);
        try {
            await setDoc(docRef, botToSave, { merge: true });
            await fetchBots(firebaseRefs.db, gameState.userId, firebaseRefs.appId);
            setGameState(prev => ({ ...prev, isLoading: false, modal: { isOpen: false } }));
        } catch (error) { console.error("Error saving bot: ", error); setGameState(prev => ({...prev, isLoading: false, modal: {isOpen:true, title:'Error', content:'Could not save bot.'}})); }
    }, [firebaseRefs, gameState.userId, gameState.currentBot, fetchBots, calculateBotStats]);

    const deleteBot = useCallback(async (botId) => {
        if (!firebaseRefs || !gameState.userId || !botId) return;
        if (!window.confirm("Are you sure you want to delete this bot forever?")) return;
        setGameState(prev => ({ ...prev, isLoading: true }));
        const docRef = doc(firebaseRefs.db, `artifacts/${firebaseRefs.appId}/users/${gameState.userId}/bots`, botId);
        try {
            await deleteDoc(docRef);
            await fetchBots(firebaseRefs.db, gameState.userId, firebaseRefs.appId);
            if(gameState.currentBot?.id === botId) setGameState(prev => ({ ...prev, currentBot: null }));
            setGameState(prev => ({ ...prev, isLoading: false, modal: { isOpen: false } }));
        } catch (error) { console.error("Error deleting bot: ", error); setGameState(prev => ({...prev, isLoading: false, modal: {isOpen:true, title:'Error', content:'Could not delete bot.'}}));}
    }, [firebaseRefs, gameState.userId, gameState.currentBot?.id, fetchBots]);

    const createNewBot = useCallback(() => {
        const chassisKey = 'chassis_light'; const chassisDef = ALL_PARTS[chassisKey];
        const weaponKey = 'weapon_flamethrower'; const shieldKey = 'utility_shield_small';
        const initialParts = [];

        if(chassisDef) {
            initialParts.push({ key: chassisKey, instanceId: `part_${Date.now()}_chassis`, pos: new THREE.Vector3(0, chassisDef.geometry.size[1]/2, 0), quat: new THREE.Quaternion() });

            const firstWeaponPoint = chassisDef.attachmentPoints?.find(ap => ap.type.includes('weapon'));
            if(ALL_PARTS[weaponKey] && firstWeaponPoint) {
                initialParts.push({ key: weaponKey, instanceId: `part_${Date.now()}_flame`, pos: new THREE.Vector3(0, chassisDef.geometry.size[1]/2, 0).add(new THREE.Vector3().fromArray(firstWeaponPoint.pos)), quat: new THREE.Quaternion(), attachmentIndex: chassisDef.attachmentPoints.indexOf(firstWeaponPoint)});
            } else if (ALL_PARTS[weaponKey]) {
                 initialParts.push({ key: weaponKey, instanceId: `part_${Date.now()}_flame`, pos: new THREE.Vector3(0, chassisDef.geometry.size[1]/2 + 0.5, 1), quat: new THREE.Quaternion()});
            }

            const firstUtilityPoint = chassisDef.attachmentPoints?.find(ap => ap.type.includes('utility') && !initialParts.some(p => p.attachmentIndex === chassisDef.attachmentPoints.indexOf(ap)));
            if(ALL_PARTS[shieldKey] && firstUtilityPoint) {
                 initialParts.push({ key: shieldKey, instanceId: `part_${Date.now()}_shield`, pos: new THREE.Vector3(0, chassisDef.geometry.size[1]/2, 0).add(new THREE.Vector3().fromArray(firstUtilityPoint.pos)), quat: new THREE.Quaternion(), attachmentIndex: chassisDef.attachmentPoints.indexOf(firstUtilityPoint)});
            } else if (ALL_PARTS[shieldKey]) {
                 initialParts.push({ key: shieldKey, instanceId: `part_${Date.now()}_shield`, pos: new THREE.Vector3(0.5, chassisDef.geometry.size[1]/2 + 0.3, -0.5), quat: new THREE.Quaternion()});
            }
        } else {
            console.error("Default chassis definition not found for createNewBot.");
            // Potentially add a basic part-less bot or show an error
        }

        const newBot = { id: `bot_${Date.now()}`, name: "New Bot", parts: initialParts, stats: calculateBotStats(initialParts) };
        setGameState(prev => ({ ...prev, currentBot: newBot, currentView: 'bot_builder' }));
    }, [ALL_PARTS, calculateBotStats]);

    const loadBot = useCallback((botId) => {
        const botToLoad = gameState.savedBots.find(b => b.id === botId);
        if(botToLoad) {
            const processedBot = {
                ...botToLoad,
                parts: botToLoad.parts.map(p => ({
                    ...p,
                    pos: p.pos && typeof p.pos.toArray === 'function' ? p.pos : new THREE.Vector3().fromArray(p.pos || [0,0,0]),
                    quat: p.quat && typeof p.quat.toArray === 'function' ? p.quat : new THREE.Quaternion().fromArray(p.quat || [0,0,0,1]),
                }))
            };
            setGameState(prev => ({...prev, currentBot: processedBot, currentView: 'bot_builder'}));
        }
    }, [gameState.savedBots]);

    const updateCurrentBot = useCallback((newParts) => {
        setGameState(prev => {
            if (!prev.currentBot) return prev;
            const updatedBot = { ...prev.currentBot, parts: newParts, stats: calculateBotStats(newParts) };
            return { ...prev, currentBot: updatedBot };
        });
    }, [calculateBotStats]);

    const setView = useCallback((view) => setGameState(prev => ({ ...prev, currentView: view })), []);
    const showModal = useCallback((title, content) => setGameState(prev => ({ ...prev, modal: { isOpen: true, title, content } })), []);
    const hideModal = useCallback(() => setGameState(prev => ({ ...prev, modal: { ...prev.modal, isOpen: false } })), []);

    useEffect(() => {
        if (firebaseRefs && gameState.userId && !gameState.savedBots.length && !gameState.isLoading) { // Check if already loading
            fetchBots(firebaseRefs.db, gameState.userId, firebaseRefs.appId);
        }
    }, [firebaseRefs, gameState.userId, gameState.savedBots.length, gameState.isLoading, fetchBots]);


    return { gameState, firebaseRefs, setView, createNewBot, loadBot, updateCurrentBot, saveCurrentBot, deleteBot, showModal, hideModal };
};

export default function App({ gameLogic, components }) {
    const { ALL_PARTS, PART_DEFINITIONS, calculateBotStats } = gameLogic;
    const {
        MainMenuComponent, GarageViewComponent, BotBuilderViewComponent, ArenaViewComponent,
        ModalComponent, SaveBotModalComponent, PartPaletteComponent, BuilderCanvasComponent,
        BotStatsComponent, StatBarComponent, HealthBarComponent, EnergyBarComponent, BattleHUDComponent,
        PartCategoryComponent
    } = components;

    const { gameState, firebaseRefs, setView, createNewBot, loadBot, updateCurrentBot, saveCurrentBot, deleteBot, showModal, hideModal } = useGame_HOOK(gameLogic);

    const handleSave = () => {
        if (!gameState.currentBot || gameState.currentBot.parts.length === 0) {
            showModal("Cannot Save", React.createElement('p', null, 'Your bot is empty. Add some parts first!'));
            setTimeout(hideModal, 2000); return;
        }
        if (!SaveBotModalComponent) {
            console.error("SaveBotModalComponent is not available to handleSave");
            return;
        }
        showModal("Save Bot", React.createElement(SaveBotModalComponent, { bot: gameState.currentBot, onSave: saveCurrentBot, onCancel: hideModal }));
    };
    const handleTest = () => {
        const hasChassis = gameState.currentBot?.parts.some(p => ALL_PARTS[p.key]?.categoryId === 'chassis');
        if (!hasChassis) {
            showModal("Cannot Test", React.createElement('p', null, 'Your bot must have a chassis before entering the arena.'));
            setTimeout(hideModal, 3000); return;
        }
        setView('arena');
    };

    const renderCurrentView = () => {
        if (gameState.isLoading || !firebaseRefs) {
            return React.createElement('div', { className: "absolute inset-0 flex items-center justify-center text-white" },
                React.createElement(Loader2, { className: "animate-spin mr-4" }), " Loading Game Data...");
        }

        // Check if all required component props are loaded
        const requiredViewComponents = { MainMenuComponent, GarageViewComponent, BotBuilderViewComponent, ArenaViewComponent };
        const requiredSubComponents = { ModalComponent, PartPaletteComponent, BuilderCanvasComponent, BotStatsComponent, StatBarComponent, HealthBarComponent, EnergyBarComponent, BattleHUDComponent, PartCategoryComponent};

        for(const key in requiredViewComponents) { if(!requiredViewComponents[key]) return React.createElement('div', null, `Loading ${key}...`); }
        for(const key in requiredSubComponents) { if(!requiredSubComponents[key]) return React.createElement('div', null, `Loading ${key}...`); }


        switch(gameState.currentView) {
            case 'bot_builder':
                return React.createElement(BotBuilderViewComponent, {
                    bot: gameState.currentBot, updateCurrentBot: updateCurrentBot,
                    onSave: handleSave, onTest: handleTest, onExit: () => setView('garage'),
                    PartPaletteComponent: (props) => React.createElement(PartPaletteComponent, {...props, PartCategoryComponent: PartCategoryComponent, partDefinitionsData: PART_DEFINITIONS }),
                    BuilderCanvasComponent: BuilderCanvasComponent,
                    BotStatsComponent: (props) => React.createElement(BotStatsComponent, {...props, StatBarComponent: StatBarComponent }),
                    ALL_PARTS_DATA: ALL_PARTS, PART_DEFINITIONS_DATA: PART_DEFINITIONS,
                    showModal: showModal, hideModal: hideModal
                });
            case 'arena':
                return React.createElement(ArenaViewComponent, {
                    playerBotData: gameState.currentBot, setView: setView, showModal: showModal,
                    ALL_PARTS_DATA: ALL_PARTS, calculateBotStats_FUNC: calculateBotStats,
                    BattleHUDComponent: (props) => React.createElement(BattleHUDComponent, {...props, HealthBarComponent: HealthBarComponent, EnergyBarComponent: EnergyBarComponent })
                });
            case 'garage':
                return React.createElement(GarageViewComponent, { bots: gameState.savedBots, onLoad: loadBot, onCreate: createNewBot, onDelete: deleteBot, onBack: ()=>setView('main_menu') });
            case 'main_menu':
            default:
                return React.createElement(MainMenuComponent, { onStartBuilder: createNewBot, onOpenGarage: () => setView('garage') });
        }
    }

    const modalContent = gameState.modal.title === "Save Bot" && SaveBotModalComponent
        ? React.createElement(SaveBotModalComponent, { bot: gameState.currentBot, onSave: saveCurrentBot, onCancel: hideModal })
        : gameState.modal.content;

    return (
        React.createElement(React.Fragment, null,
            React.createElement('style', { dangerouslySetInnerHTML: { __html: `
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Roboto:wght@300;400;700&display=swap');
                body { font-family: 'Roboto', sans-serif; background: linear-gradient(135deg, #0a0a0a, #1a1a2e, #16213e); color: #e0e0e0; margin: 0; padding: 0; overflow: hidden;}
                #root { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
                .menu-button { padding: 12px 24px; border-radius: 8px; color: white; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 2px solid transparent; cursor: pointer; }
                .menu-button:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5); }
                .builder-button { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 6px; color: white; font-weight: bold; transition: all 0.2s; cursor: pointer; }
            `}})
            ,
            React.createElement('main', { className: "w-screen h-screen flex items-center justify-center p-0 md:p-4 bg-transparent" },
                React.createElement('div', { className: "w-full h-full max-w-screen-2xl relative" },
                    renderCurrentView(),
                    ModalComponent && gameState.modal.isOpen && React.createElement(ModalComponent, {
                        modal: {...gameState.modal, content: modalContent },
                        onCancel: hideModal,
                        onConfirm: gameState.modal.title === "Save Bot" ? null : () => { /* Generic confirm if needed */ hideModal(); }
                    })
                )
            )
        )
    );
}
