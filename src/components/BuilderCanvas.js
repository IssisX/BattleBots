import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Co-located createPartMeshFromDef (originally createPartMesh)
// This function is also needed by ArenaView, so ideally it would be in a shared utils file.
export const createPartMeshFromDef = (partDef) => {
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
            shape.moveTo(-width / 2, -height / 2);
            shape.lineTo(width / 2, -height / 2);
            shape.lineTo(width / 2, height / 2);
            geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
            geometry.center();
            break;
        default: geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
};

export const BuilderCanvas = forwardRef(({ bot, updateCurrentBot, showModal, hideModal, ALL_PARTS_DATA }, ref) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null); // Changed to sceneRef to avoid conflict with THREE.Scene
    const cameraRef = useRef(null); // Changed to cameraRef
    const rendererRef = useRef(null); // Changed to rendererRef
    const controlsRef = useRef(null); // Changed to controlsRef
    const raycasterRef = useRef(new THREE.Raycaster()); // Changed to raycasterRef
    const mouseRef = useRef(new THREE.Vector2()); // Changed to mouseRef
    const botContainerRef = useRef(null); // Changed to botContainerRef
    const attachmentPointMeshesRef = useRef([]); // Changed to attachmentPointMeshesRef

    useImperativeHandle(ref, () => ({
        clearAllParts: () => {
            if (!bot || !ALL_PARTS_DATA) return;
            const chassis = bot.parts.find(p => ALL_PARTS_DATA[p.key]?.categoryId === 'chassis');
            updateCurrentBot(chassis ? [chassis] : []);
        },
    }));

    useEffect(() => {
        if (!botContainerRef.current || !bot || !ALL_PARTS_DATA) return;
        while (botContainerRef.current.children.length) {
            botContainerRef.current.remove(botContainerRef.current.children[0]);
        }
        bot.parts.forEach(part => {
            const partDef = ALL_PARTS_DATA[part.key];
            if (partDef) {
                const mesh = createPartMeshFromDef(partDef);
                mesh.position.copy(new THREE.Vector3(part.pos.x, part.pos.y, part.pos.z)); // Ensure THREE.Vector3
                mesh.quaternion.copy(new THREE.Quaternion(part.quat.x, part.quat.y, part.quat.z, part.quat.w)); // Ensure THREE.Quaternion
                mesh.userData = { partInstanceId: part.instanceId, key: part.key };
                botContainerRef.current.add(mesh);
            }
        });
        // Call as a method of current component instance or ensure it's in scope correctly
        updateAttachmentVisuals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bot, ALL_PARTS_DATA, updateCurrentBot]); // updateCurrentBot might not be needed if updateAttachmentVisuals doesn't depend on it

    const updateAttachmentVisuals = () => {
        if (!sceneRef.current || !bot || !ALL_PARTS_DATA) return;
        attachmentPointMeshesRef.current.forEach(mesh => sceneRef.current.remove(mesh));
        attachmentPointMeshesRef.current = [];

        const chassisPartInstance = bot.parts.find(p => ALL_PARTS_DATA[p.key]?.categoryId === 'chassis');
        if (!chassisPartInstance) return;

        const chassisDef = ALL_PARTS_DATA[chassisPartInstance.key];
        if (!chassisDef.attachmentPoints) return;

        chassisDef.attachmentPoints.forEach((point, index) => {
            const isOccupied = bot.parts.some(p => p.attachmentIndex === index && p.key !== chassisPartInstance.key);
            if (isOccupied) return;

            const geometry = new THREE.TorusGeometry(0.2, 0.05, 8, 24);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.7, wireframe: true });
            const mesh = new THREE.Mesh(geometry, material);

            // Ensure chassisPartInstance.pos is a THREE.Vector3, if not, create one
            const chassisPos = chassisPartInstance.pos instanceof THREE.Vector3 ?
                               chassisPartInstance.pos :
                               new THREE.Vector3(chassisPartInstance.pos.x, chassisPartInstance.pos.y, chassisPartInstance.pos.z);

            mesh.position.fromArray(point.pos).add(chassisPos);
            mesh.rotation.x = Math.PI / 2;
            mesh.userData = { isAttachmentPoint: true, attachmentIndex: index };
            sceneRef.current.add(mesh);
            attachmentPointMeshesRef.current.push(mesh);
        });
    };


    useEffect(() => {
        const currentMount = mountRef.current;
        sceneRef.current = new THREE.Scene();
        sceneRef.current.background = new THREE.Color(0x1a1a2e);
        sceneRef.current.fog = new THREE.Fog(0x1a1a2e, 20, 100);
        cameraRef.current = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
        cameraRef.current.position.set(6, 6, 6);
        rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        rendererRef.current.setPixelRatio(window.devicePixelRatio);
        rendererRef.current.shadowMap.enabled = true;
        currentMount.appendChild(rendererRef.current.domElement);
        controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
        controlsRef.current.enableDamping = true;
        sceneRef.current.add(new THREE.AmbientLight(0x404040, 3));
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.set(2048, 2048);
        sceneRef.current.add(directionalLight);
        const gridHelper = new THREE.GridHelper(40, 40, 0x00ffff, 0x444444);
        gridHelper.material.transparent = true; gridHelper.material.opacity = 0.3;
        sceneRef.current.add(gridHelper);
        botContainerRef.current = new THREE.Group();
        sceneRef.current.add(botContainerRef.current);

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        };
        animate();

        const handleResize = () => {
            if(!currentMount || !rendererRef.current || !cameraRef.current) return;
            cameraRef.current.aspect = currentMount.clientWidth / currentMount.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Initial call to populate parts if bot is already loaded
        if (bot && botContainerRef.current && ALL_PARTS_DATA) {
             while (botContainerRef.current.children.length) {
                botContainerRef.current.remove(botContainerRef.current.children[0]);
            }
            bot.parts.forEach(part => {
                const partDef = ALL_PARTS_DATA[part.key];
                if (partDef) {
                    const mesh = createPartMeshFromDef(partDef);
                    mesh.position.copy(new THREE.Vector3(part.pos.x, part.pos.y, part.pos.z));
                    mesh.quaternion.copy(new THREE.Quaternion(part.quat.x, part.quat.y, part.quat.z, part.quat.w));
                    mesh.userData = { partInstanceId: part.instanceId, key: part.key };
                    botContainerRef.current.add(mesh);
                }
            });
            updateAttachmentVisuals();
        }


        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            if(rendererRef.current && currentMount && rendererRef.current.domElement.parentNode === currentMount) {
                currentMount.removeChild(rendererRef.current.domElement);
            }
            // Dispose of Three.js objects for cleanup if needed
            // sceneRef.current.dispose(); rendererRef.current.dispose();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // ALL_PARTS_DATA removed from dep array of main setup to avoid re-setup if it changes. Bot specific updates are in the other useEffect.

    const handleDrop = (e) => {
        e.preventDefault();
        const partKey = e.dataTransfer.getData("text/plain");
        if (!partKey || !ALL_PARTS_DATA || !mountRef.current || !cameraRef.current || !raycasterRef.current || !mouseRef.current) return;

        const partDef = ALL_PARTS_DATA[partKey];
        if (!partDef || !bot) return; // bot might be null initially

        const rect = mountRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        const isChassis = partDef.categoryId === 'chassis';
        if (isChassis) {
            if (bot.parts.some(p => ALL_PARTS_DATA[p.key].categoryId === 'chassis')) {
                if (window.confirm("This will replace your current chassis and remove all attached parts. Continue?")) {
                    updateCurrentBot([{ key: partKey, instanceId: `part_${Date.now()}`, pos: new THREE.Vector3(0, partDef.geometry.size[1]/2, 0), quat: new THREE.Quaternion() }]);
                }
            } else {
                updateCurrentBot([{ key: partKey, instanceId: `part_${Date.now()}`, pos: new THREE.Vector3(0, partDef.geometry.size[1]/2, 0), quat: new THREE.Quaternion() }]);
            }
        } else {
            const intersects = raycasterRef.current.intersectObjects(attachmentPointMeshesRef.current);
            if (intersects.length > 0) {
                const pointMesh = intersects[0].object;
                const newPart = {
                    key: partKey,
                    instanceId: `part_${Date.now()}`,
                    pos: pointMesh.position.clone(),
                    quat: new THREE.Quaternion(),
                    attachmentIndex: pointMesh.userData.attachmentIndex,
                };
                updateCurrentBot([...bot.parts, newPart]);
            }
        }
    };

    const handleRightClick = (e) => {
        e.preventDefault();
        if(!bot || !ALL_PARTS_DATA || !mountRef.current || !cameraRef.current || !raycasterRef.current || !mouseRef.current || !botContainerRef.current) return;

        const rect = mountRef.current.getBoundingClientRect();
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

        const intersects = raycasterRef.current.intersectObjects(botContainerRef.current.children);
        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const { partInstanceId, key } = clickedMesh.userData;
            if (ALL_PARTS_DATA[key]?.categoryId === 'chassis') { // Added optional chaining for safety
                if (showModal && hideModal) { // Check if modal functions are provided
                    showModal("Cannot Remove Chassis", "The chassis cannot be removed directly. Drag a new chassis into the scene to replace it.");
                    setTimeout(hideModal, 3000);
                } else {
                    alert("Cannot Remove Chassis. The chassis cannot be removed directly."); // Fallback
                }
                return;
            }
            if (window.confirm("Remove this part?")) {
                updateCurrentBot(bot.parts.filter(p => p.instanceId !== partInstanceId));
            }
        }
    };

    if (!bot) {
        return React.createElement('div', { ref: mountRef, className: "w-full h-full flex items-center justify-center text-gray-500 bg-gray-900" },
            React.createElement('p', null, "Create a new bot or load one from the Garage to start.")
        );
    }
    return React.createElement('div', {
        ref: mountRef,
        className: "w-full h-full cursor-pointer",
        onDrop: handleDrop,
        onDragOver: (e) => e.preventDefault(),
        onContextMenu: handleRightClick
    });
});

// export default BuilderCanvas; // Default export can be added if this is the only export.
