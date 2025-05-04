import * as THREE from './three.module.min.js';
import { OrbitControls } from './OrbitControls.js';
const gameState = {
    isMeasuring: false,
startPoint: null,
currentBearing: 0,
measurementLine: null,
measurementLabel: null,
started: false,
batteryName: "Alpha Battery",
difficulty: "medium",
shells: 0,
maxShells: 100,
timeLimit: 13 * 60, 
timeRemaining: 0,
timerInterval: null,
score: 0,
wins: 0,
showTrajectory: false,
targetType: null,
shellType: null,
positions: {
battery: new THREE.Vector3(0, 0, 0),
forwardObserver: new THREE.Vector3(0, 0, 0),
target: new THREE.Vector3(0, 0, 0)
},
distances: {
batteryToTarget: 0,
batteryToFO: 0,
foToTarget: 0
},
angles: {
atBattery: 0,
atFO: 0,
atTarget: 0
},
solution: {
elevation: 0,
azimuth: 0
},
currentElevation: 0,
currentAzimuth: 0,
isFiring: false,
debugMode: false,
secretCode: "",
lastKeyTime: 0,
currentChamberedBulletType: null, // Store the type (e.g., 'FMJ', 'API'),
};
const targetTypes = {
aircraft: [
"MiG-29 Fighter",
"Su-25 Attack Aircraft",
"Mi-24 Helicopter",
"Tu-95 Bomber",
"Ka-52 Helicopter"
],
armoredVehicles: [
"T-72 Main Battle Tank",
"BMP-3 Infantry Fighting Vehicle",
"BTR-80 Armored Personnel Carrier",
"2S19 Msta Self-Propelled Howitzer",
"ZSU-23-4 Anti-Aircraft System"
],
buildings: [
"Command Post",
"Ammunition Depot",
"Communications Center",
"Radar Station",
"Fuel Storage Facility"
]
};
const shellTypes = {
aircraft: "Flak",
armoredVehicles: "Armor-Piercing Capped",
buildings: "HE Concussion"
};
const difficultySettings = {
easiest: {
name: "Relaxed mode 😄",
shells: 100,
timeLimit: Infinity,
showTrajectory: true,
scoreMultiplier: 0
},
easy: {
name: "Elementary mode 😊",
shells: 3,
timeLimit: 10 * 60,
showTrajectory: true,
scoreMultiplier: 1
},
medium: {
name: "Humane mode 🙂",
shells: 2,
timeLimit: 5 * 60,
showTrajectory: false,
scoreMultiplier: 1
},
hard: {
name: "Hard mode 😟",
shells: 1,
timeLimit: 3 * 60,
showTrajectory: false,
scoreMultiplier: 3
},
hardest: {
name: "World War 2 Veteran 😡",
shells: 1,
timeLimit: 2 * 60,
showTrajectory: false,
scoreMultiplier: 10
}
};
const militaryRanks = [
    { score: 0, rank: "Basic Cadet" },
    { score: 900, rank: "Private" },
    { score: 1800, rank: "Private First Class" },
    { score: 2700, rank: "Corporal" },
    { score: 3600, rank: "Sergeant" },
    { score: 4500, rank: "Staff Sergeant" },
    { score: 5400, rank: "Sergeant First Class" },
    { score: 6300, rank: "Master Sergeant" },
    { score: 7200, rank: "Lieutenant" },
    { score: 8100, rank: "First Lieutenant" },
    { score: 9000, rank: "Captain" },
    { score: 9900, rank: "Major" },
    { score: 10800, rank: "Lieutenant Colonel" },
    { score: 11700, rank: "Colonel" },
    { score: 12600, rank: "Brigadier General" },
    { score: 13500, rank: "Major General" },
    { score: 14400, rank: "Lieutenant General" },
    { score: 15300, rank: "General" },
    { score: 16200, rank: "Field Marshal" },
    { score: 17100, rank: "Marshal of the Army" }
  ];
let scene, camera, renderer, controls;
let artillery, artilleryBarrel;
let shell, shellTrajectory, barrelTip;
let ground, skybox;
let targetMesh, foMesh, batteryMesh;
let raycaster, mouse;
let initialGroupRotationX = 0;  
let clock = new THREE.Clock();
const mapTypes = ["snowy", "desert", "denseforest"];
let terrain;
let currentMapType = mapTypes[Math.floor(Math.random() * mapTypes.length)];
const homeScreen = document.getElementById('home-screen');
const batteryNameInput = document.getElementById('battery-name-input');
const difficultySelect = document.getElementById('difficulty-select');
const startButton = document.getElementById('start-button');
const tutorialButton = document.getElementById('tutorial-button');
const tutorialContainer = document.getElementById('tutorial-container');
const closeTutorial = document.getElementById('close-tutorial');
const hud = document.getElementById('hud');
const controlsPanel = document.getElementById('controls');
const missionInfo = document.getElementById('mission-info');
const targetInfo = document.getElementById('target-info');
const elevationInput = document.getElementById('elevation-input');
const elevationSlider = document.getElementById('elevation-slider');
const azimuthInput = document.getElementById('azimuth-input');
const azimuthSlider = document.getElementById('azimuth-slider');
const fireButton = document.getElementById('fire-button');
const chartButton = document.getElementById('chart-button');
const giveUpButton = document.getElementById('give-up-button');
const commanderChart = document.getElementById('commander-chart');
const closeChart = document.getElementById('close-chart');
const chartMap = document.getElementById('chart-map');
const toggleTriangle = document.getElementById('toggle-triangle');
const toggleRuler = document.getElementById('toggle-ruler');
const bearingRuler = document.getElementById('bearing-ruler');
const foReport = document.getElementById('fo-report');
const gameOver = document.getElementById('game-over');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverStats = document.getElementById('game-over-stats');
const restartButton = document.getElementById('restart-button');
const timerDisplay = document.getElementById('timer-display');
const messageLog = document.getElementById('message-log');
const shellCounter = document.getElementById('shell-counter');
const notesTextarea = document.getElementById('notes-textarea');
const calcDisplay = document.getElementById('calc-display');
const calcButtons = document.querySelectorAll('.calc-button');
const smokeTexture = new THREE.TextureLoader().load('smoke.png');
const smokeParticles = [];
// ... existing consts ...

const bulletRack = document.getElementById('bullet-rack');
const chamberContainer = document.getElementById('chamber-container');
const chamberInterior = document.getElementById('chamber-interior');
const chamberSlot = document.getElementById('chamber-slot');
const bulletTypeMapping = {
    'FMJ': { shell: 'HE Concussion', target: 'buildings' },
    'API': { shell: 'Armor-Piercing Capped', target: 'armoredVehicles' },
    'ETR': { shell: 'Flak', target: 'aircraft' }
};
// ... rest of existing consts ...
let elevationGroupReference; 

function init() {
initThreeJS();
setupEventListeners();
setupCalculator();
createBulletElements();
animate();
}

// Randomly choose a map type.

console.log("Randomly selected map type:", currentMapType);

function initThreeJS() {
// ------------ Scene, Camera & Renderer Setup ------------
scene = new THREE.Scene();
switch (currentMapType) {
case "snowy":
    scene.fog = new THREE.FogExp2(0xddddff, 0.0004);
    break;
case "desert":
    scene.fog = new THREE.FogExp2(0xf4a460, 0.0005);
    break;
case "denseforest":
    scene.fog = new THREE.FogExp2(0x90a0b0, 0.0005);
    break;
default:
    scene.fog = new THREE.FogExp2(0x90a0b0, 0.0005);
}

camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 20000);
camera.position.set(50, 30, 50);
camera.lookAt(0, 0, 0);

renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
switch (currentMapType) {
case "snowy":
    renderer.setClearColor(0xddddff);
    break;
case "desert":
    renderer.setClearColor(0xf4a460);
    break;
case "denseforest":
    renderer.setClearColor(0x90a0b0);
    break;
default:
    renderer.setClearColor(0x90a0b0);
}
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minPolarAngle = 0.1;
controls.maxPolarAngle = Math.PI/2 - 0.1;
controls.minDistance = 10;
controls.maxDistance = 500;

// ------------ Lighting Setup ------------
const ambientLight = new THREE.AmbientLight(0x404040, 3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 300, 100);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// ------------ Ground (Terrain) Creation ------------
const textureLoader = new THREE.TextureLoader();
let textures = {};
switch (currentMapType) {
case "snowy":
    textures = {
        color: textureLoader.load('snow/color.png'),
        normal: textureLoader.load('snow/normal.png'),
        ao: textureLoader.load('snow/ao.png'),
        rough: textureLoader.load('snow/rough.png')
    };
    break;
case "desert":
    textures = {
        color: textureLoader.load('desert/color.png'),
        normal: textureLoader.load('desert/normal.png'),
        ao: textureLoader.load('desert/ao.png'),
        rough: textureLoader.load('desert/rough.png')
    };
    break;
case "denseforest":
    textures = {
        color: textureLoader.load('forest/color.png'),
        normal: textureLoader.load('forest/normal.png'),
        ao: textureLoader.load('forest/ao.png'),
        rough: textureLoader.load('forest/rough.png')
    };
    break;
default:
    textures = {
        color: textureLoader.load('fart/text.png'),
        normal: textureLoader.load('fart/normal.png'),
        ao: textureLoader.load('fart/ao.png'),
        rough: textureLoader.load('fart/rough.png')
    };
}
Object.values(textures).forEach(texture => {
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(512, 512);
});

// Create terrain with an artillery “flat” center.
const artilleryFlatRadius = 40;
const transitionBandWidth = 60;
const geometry = new THREE.PlaneGeometry(10000, 10000, 200, 200);
geometry.rotateX(-Math.PI/2);
const vertices = geometry.attributes.position.array;
for (let i = 0; i < vertices.length; i+=3) {
const x = vertices[i], z = vertices[i+2];
const distance = Math.sqrt(x*x + z*z);
if (distance < artilleryFlatRadius) {
    vertices[i+1] = 0;
} else if (distance < artilleryFlatRadius + transitionBandWidth) {
    const hillyHeight = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10;
    const blend = (distance - artilleryFlatRadius) / transitionBandWidth;
    vertices[i+1] = blend * hillyHeight;
} else {
    vertices[i+1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10;
}
}
geometry.computeVertexNormals();

const material = new THREE.MeshStandardMaterial({
map: textures.color,
normalMap: textures.normal,
aoMap: textures.ao,
metalness: 0.2,
roughness: 0.8,
roughnessMap: textures.rough,
side: THREE.DoubleSide,
flatShading: false
});
terrain = new THREE.Mesh(geometry, material);
terrain.receiveShadow = true;
scene.add(terrain);

// ------------ Skybox Creation ------------
const skyGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
let skyColor;
switch (currentMapType) {
case "snowy":
    skyColor = 0xddddff;
    break;
case "desert":
    skyColor = 0xf4a460;
    break;
case "denseforest":
    skyColor = 0x87ceeb;
    break;
default:
    skyColor = 0x87ceeb;
}
const skyMaterials = new Array(6).fill(null)
.map(() => new THREE.MeshBasicMaterial({ color: skyColor, side: THREE.BackSide }));
skybox = new THREE.Mesh(skyGeometry, skyMaterials);
scene.add(skybox);

// ------------ Artillery & Obstacle Setup ------------
createArtillery();


// Instead of creating obstacles one by one, we now use instancing for
// snow trees (in snowy maps) and cacti (in desert maps).
createMapObstacles(currentMapType, 50, 50);

raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();
window.addEventListener('resize', () => {
camera.aspect = window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
});
}

// Adjusted obstacle generator that uses instancing for "snowy" and "desert" maps.
function createMapObstacles(mapType, artillerySafeRadius, targetSafeRadius) {
if (mapType === "snowy") {
// Create instanced snow trees.
const numSnowTrees = 8000;
createInstancedSnowTrees(numSnowTrees, artillerySafeRadius, targetSafeRadius);
} else if (mapType === "desert") {
// Create instanced cacti.
const numCacti = 10000;
createInstancedCacti(numCacti, artillerySafeRadius, targetSafeRadius);
} else if (mapType === "denseforest") {
// For denseforest, continue with individual trees.
const numTrees = 3000;
for (let i = 0; i < numTrees; i++) {
    let x = Math.random() * 10000 - 5000;
    let z = Math.random() * 10000 - 5000;
    
    // Avoid safe zones.
    if (Math.sqrt(x*x + z*z) < artillerySafeRadius) continue;
    if (typeof gameState !== "undefined" && gameState.positions && gameState.positions.target) {
        let dx = x - gameState.positions.target.x;
        let dz = z - gameState.positions.target.z;
        if (Math.sqrt(dx*dx + dz*dz) < targetSafeRadius) continue;
    }
    const tree = createTree(); // your existing createTree() function.
    tree.position.set(x, 0, z);
    scene.add(tree);
}
}
}

// ---------------------- Instanced Mesh for Snow Trees ----------------------
// Here we use two instanced meshes—one for the trunk and one for the foliage.
// They share the same transform per instance so they appear as one tree.
function createInstancedSnowTrees(numInstances, artillerySafeRadius, targetSafeRadius) {
// Create trunk geometry (a small cylinder).
const trunkGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
trunkGeo.translate(0, 1, 0); // so the base sits on the ground.
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, numInstances);

// Create foliage geometry (a cone to mimic snow-covered branches).
const foliageGeo = new THREE.ConeGeometry(2, 5, 8);
foliageGeo.translate(0, 3.5, 0); // position the foliage atop the trunk.
const foliageMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, numInstances);

const dummy = new THREE.Object3D();
let placed = 0, attempts = 0;
while (placed < numInstances && attempts < numInstances * 5) {
attempts++;
let x = Math.random() * 10000 - 5000;
let z = Math.random() * 10000 - 5000;
// Skip if too near artillery.
if (Math.sqrt(x*x + z*z) < artillerySafeRadius) continue;
// Skip if near target.
if (typeof gameState !== "undefined" && gameState.positions && gameState.positions.target) {
    let dx = x - gameState.positions.target.x;
    let dz = z - gameState.positions.target.z;
    if (Math.sqrt(dx*dx + dz*dz) < targetSafeRadius) continue;
}
dummy.position.set(x, 0, z);
dummy.rotation.y = Math.random() * Math.PI * 2;
const scale = 0.8 + Math.random() * 0.4;
dummy.scale.set(scale, scale, scale);
dummy.updateMatrix();
trunkMesh.setMatrixAt(placed, dummy.matrix);
foliageMesh.setMatrixAt(placed, dummy.matrix);
placed++;
}
trunkMesh.instanceMatrix.needsUpdate = true;
foliageMesh.instanceMatrix.needsUpdate = true;
scene.add(trunkMesh);
scene.add(foliageMesh);
}

// ---------------------- Instanced Mesh for Desert Cacti ----------------------
function createInstancedCacti(numInstances, artillerySafeRadius, targetSafeRadius) {
// Create a simple cactus geometry.
const cactusGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
cactusGeo.translate(0, 1.5, 0); // ensure the base is on the ground.
const cactusMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const cactusMesh = new THREE.InstancedMesh(cactusGeo, cactusMat, numInstances);

const dummy = new THREE.Object3D();
let placed = 0, attempts = 0;
while (placed < numInstances && attempts < numInstances * 5) {
attempts++;
let x = Math.random() * 10000 - 5000;
let z = Math.random() * 10000 - 5000;
if (Math.sqrt(x*x + z*z) < artillerySafeRadius) continue;
if (typeof gameState !== "undefined" && gameState.positions && gameState.positions.target) {
    let dx = x - gameState.positions.target.x;
    let dz = z - gameState.positions.target.z;
    if (Math.sqrt(dx*dx + dz*dz) < targetSafeRadius) continue;
}
dummy.position.set(x, 0, z);
dummy.rotation.y = Math.random() * Math.PI * 2;
const scale = 0.8 + Math.random() * 0.6;
dummy.scale.set(scale, scale, scale);
dummy.updateMatrix();
cactusMesh.setMatrixAt(placed, dummy.matrix);
placed++;
}
cactusMesh.instanceMatrix.needsUpdate = true;
scene.add(cactusMesh);
}

function createTree() {
const trunkGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const trunk = new THREE.Mesh(trunkGeo, trunkMat);
trunk.position.y = 2.5;

const foliageGeo = new THREE.ConeGeometry(2.5, 8, 8);
const foliageMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const foliage = new THREE.Mesh(foliageGeo, foliageMat);
foliage.position.y = 7;

const tree = new THREE.Group();
tree.add(trunk);
tree.add(foliage);
return tree;
}

function createRock() {
const size = Math.random() * 2 + 1;
const rockGeo = new THREE.DodecahedronGeometry(size, 0);
const rockMat = new THREE.MeshStandardMaterial({ color: 0xC2B280 });
const rock = new THREE.Mesh(rockGeo, rockMat);
rock.position.y = size / 2;
return rock;
}

function createSnowBoulder() {
const size = Math.random() * 1.5 + 0.5;
const boulderGeo = new THREE.DodecahedronGeometry(size, 0);
const boulderMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
const boulder = new THREE.Mesh(boulderGeo, boulderMat);
boulder.position.y = size / 2;
return boulder;
}

function createDefaultObstacle() {
const geo = new THREE.BoxGeometry(2, 2, 2);
const mat = new THREE.MeshStandardMaterial({ color: 0x808080 });
const obj = new THREE.Mesh(geo, mat);
obj.position.y = 1;
return obj;
}

function createArtillery() {
// Create the main artillery group
artillery = new THREE.Group();

//---------------------------
// Create the wagon (static part)
//---------------------------
const wagon = new THREE.Group();

// Base with beveled edges
const baseGeometry = new THREE.BoxGeometry(10, 1.5, 8);
const baseMaterial = new THREE.MeshStandardMaterial({
color: 0x3d5e35,
roughness: 0.7,
metalness: 0.2
});
const base = new THREE.Mesh(baseGeometry, baseMaterial);
base.position.y = 0.75;
base.castShadow = true;
base.receiveShadow = true;
wagon.add(base);

// Detailed wheels with spokes and rims
const createDetailedWheel = (posX, posY, posZ) => {
const wheelGroup = new THREE.Group();
wheelGroup.position.set(posX, posY, posZ);

// Tire
const tireGeometry = new THREE.TorusGeometry(2.5, 0.5, 16, 32);
const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.9,
    metalness: 0.1
});
const tire = new THREE.Mesh(tireGeometry, tireMaterial);
tire.rotation.y = Math.PI / 2;
tire.castShadow = true;
wheelGroup.add(tire);

// Hub
const hubGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
const hubMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.5,
    metalness: 0.6
});
const hub = new THREE.Mesh(hubGeometry, hubMaterial);
hub.rotation.x = Math.PI / 2;
hub.castShadow = true;
wheelGroup.add(hub);

// Spokes
const spokeMaterial = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.4,
    metalness: 0.7
});

for (let i = 0; i < 8; i++) {
    const spokeGeometry = new THREE.BoxGeometry(0.2, 0.2, 2.3);
    const spoke = new THREE.Mesh(spokeGeometry, spokeMaterial);
    spoke.rotation.z = (i * Math.PI) / 4;
    spoke.position.x = 0;
    spoke.castShadow = true;
    wheelGroup.add(spoke);
}

return wheelGroup;
};

const leftWheel = createDetailedWheel(0, 2, 4.5);
wagon.add(leftWheel);

const rightWheel = createDetailedWheel(0, 2, -4.5);
wagon.add(rightWheel);

// Enhanced legs with joints
const createLeg = (posX, posY, posZ, rotZ) => {
const legGroup = new THREE.Group();
legGroup.position.set(posX, posY, posZ);

// Main leg
const legGeometry = new THREE.BoxGeometry(1, 3, 1);
const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.6,
    metalness: 0.4
});
const leg = new THREE.Mesh(legGeometry, legMaterial);
leg.rotation.z = rotZ;
leg.castShadow = true;
legGroup.add(leg);

// Joint
const jointGeometry = new THREE.SphereGeometry(0.6, 12, 12);
const jointMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.4,
    metalness: 0.7
});
const joint = new THREE.Mesh(jointGeometry, jointMaterial);
joint.position.y = -1.5;
joint.position.x = Math.sin(rotZ) * 1.5;
joint.castShadow = true;
legGroup.add(joint);

// Foot
const footGeometry = new THREE.BoxGeometry(2, 0.5, 2);
const footMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.7,
    metalness: 0.3
});
const foot = new THREE.Mesh(footGeometry, footMaterial);
foot.position.y = -1.75;
foot.position.x = Math.sin(rotZ) * 1.8;
foot.castShadow = true;
legGroup.add(foot);

return legGroup;
};

wagon.add(createLeg(4, 1.5, 3, Math.PI / 6));
wagon.add(createLeg(4, 1.5, -3, Math.PI / 6));
wagon.add(createLeg(-4, 1.5, 3, -Math.PI / 6));
wagon.add(createLeg(-4, 1.5, -3, -Math.PI / 6));

// Add details to the base
const createBaseDetail = () => {
const detailGroup = new THREE.Group();

// Rivets
const rivetGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8);
const rivetMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.3,
    metalness: 0.8
});

// Add rivets along the edges
for (let x = -4; x <= 4; x += 2) {
    for (let z = -3.5; z <= 3.5; z += 7) {
        const rivet = new THREE.Mesh(rivetGeometry, rivetMaterial);
        rivet.position.set(x, 1.5, z);
        rivet.rotation.x = Math.PI / 2;
        detailGroup.add(rivet);
    }
}

// Reinforcement plates
const plateGeometry = new THREE.BoxGeometry(9, 0.2, 1);
const plateMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.5,
    metalness: 0.6
});

const frontPlate = new THREE.Mesh(plateGeometry, plateMaterial);
frontPlate.position.set(0, 1.5, 3.5);
detailGroup.add(frontPlate);

const backPlate = new THREE.Mesh(plateGeometry, plateMaterial);
backPlate.position.set(0, 1.5, -3.5);
detailGroup.add(backPlate);

return detailGroup;
};

wagon.add(createBaseDetail());

// Rotate the wagon so it faces the correct direction
wagon.rotation.y = Math.PI / 2;
artillery.add(wagon);

//---------------------------
// Create the elevation group for rotating parts
//---------------------------
const elevationGroup = new THREE.Group();
elevationGroup.position.set(0, 4, 0);

// --- Cradle with details ---
const cradleGroup = new THREE.Group();

const cradleGeometry = new THREE.BoxGeometry(4, 3, 4);
const cradleMaterial = new THREE.MeshStandardMaterial({
color: 0x3a5f0b,
roughness: 0.5,
metalness: 0.4
});
const cradle = new THREE.Mesh(cradleGeometry, cradleMaterial);
cradle.castShadow = true;
cradle.receiveShadow = true;
cradleGroup.add(cradle);

// Add cradle details - handles and gauges
const handleGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 16, Math.PI);
const handleMaterial = new THREE.MeshStandardMaterial({
color: 0x222222,
roughness: 0.3,
metalness: 0.8
});

const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
leftHandle.position.set(2.1, 0, 0);
leftHandle.rotation.y = Math.PI / 2;
cradleGroup.add(leftHandle);

const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
rightHandle.position.set(-2.1, 0, 0);
rightHandle.rotation.y = -Math.PI / 2;
cradleGroup.add(rightHandle);

// Gauge
const gaugeBaseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
const gaugeMaterial = new THREE.MeshStandardMaterial({
color: 0x333333,
roughness: 0.4,
metalness: 0.7
});
const gaugeBase = new THREE.Mesh(gaugeBaseGeometry, gaugeMaterial);
gaugeBase.position.set(0, 1, 2.1);
gaugeBase.rotation.x = Math.PI / 2;
cradleGroup.add(gaugeBase);

const gaugeDialGeometry = new THREE.CircleGeometry(0.4, 16);
const gaugeDialMaterial = new THREE.MeshStandardMaterial({
color: 0xeeeeee,
roughness: 0.2,
metalness: 0.3
});
const gaugeDial = new THREE.Mesh(gaugeDialGeometry, gaugeDialMaterial);
gaugeDial.position.set(0, 1, 2.2);
gaugeDial.rotation.x = Math.PI / 2;
cradleGroup.add(gaugeDial);

// Needle
const needleGeometry = new THREE.BoxGeometry(0.05, 0.01, 0.3);
const needleMaterial = new THREE.MeshStandardMaterial({
color: 0xff0000
});
const needle = new THREE.Mesh(needleGeometry, needleMaterial);
needle.position.set(0, 1, 2.21);
needle.rotation.x = Math.PI / 2;
needle.rotation.z = Math.PI / 4;
cradleGroup.add(needle);

elevationGroup.add(cradleGroup);

// --- Elevation Arc with markings ---
const arcGroup = new THREE.Group();

const arcGeometry = new THREE.TorusGeometry(3, 0.3, 8, 24, Math.PI / 2);
const arcMaterial = new THREE.MeshStandardMaterial({
color: 0x555555,
roughness: 0.5,
metalness: 0.5
});
const elevationArc = new THREE.Mesh(arcGeometry, arcMaterial);
elevationArc.rotation.y = Math.PI / 2;
arcGroup.add(elevationArc);



elevationGroup.add(arcGroup);

// --- Barrel Group with enhanced details ---
const barrelGroup = new THREE.Group();

// Main barrel with rifling details
const barrelGeometry = new THREE.CylinderGeometry(0.9, 1.1, 18, 24);
barrelGeometry.translate(0, 9, 0);
const barrelMaterial = new THREE.MeshStandardMaterial({
color: 0x333333,
roughness: 0.4,
metalness: 0.7
});
artilleryBarrel = new THREE.Mesh(barrelGeometry, barrelMaterial,);
artilleryBarrel.rotation.x = Math.PI / 2;
artilleryBarrel.castShadow = true;

barrelGroup.add(artilleryBarrel);

// Barrel Base with more detail
const barrelBaseGeometry = new THREE.CylinderGeometry(1.4, 1.8, 2, 24);
const barrelBase = new THREE.Mesh(barrelBaseGeometry, barrelMaterial);
barrelBase.rotation.x = Math.PI / 2;
barrelBase.position.set(0, 0, 1);
barrelBase.castShadow = true;
barrelGroup.add(barrelBase);

// Muzzle with brake
const muzzleGroup = new THREE.Group();
muzzleGroup.position.set(0, 0, 17.5);

const muzzleGeometry = new THREE.CylinderGeometry(1.8, 1.4, 2, 24);
const muzzle = new THREE.Mesh(muzzleGeometry, barrelMaterial);
muzzle.rotation.x = Math.PI / 2;
muzzle.castShadow = true;
muzzleGroup.add(muzzle);

// Muzzle brake vents
const ventGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.5);
const ventMaterial = new THREE.MeshStandardMaterial({
color: 0x111111,
roughness: 0.3,
metalness: 0.8
});

// Add vents around the muzzle
for (let i = 0; i < 6; i++) {
const angle = (i * Math.PI) / 3;
const vent = new THREE.Mesh(ventGeometry, ventMaterial);
vent.position.set(
    1.5 * Math.cos(angle),
    1.5 * Math.sin(angle),
    0
);
vent.rotation.z = angle;
muzzleGroup.add(vent);
}

barrelGroup.add(muzzleGroup);

// Enhanced recoil system
const recoilGroup = new THREE.Group();

// Main recoil cylinders
const recoilCylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 16);
const recoilMaterial = new THREE.MeshStandardMaterial({
color: 0x666666,
roughness: 0.3,
metalness: 0.8
});

const topRecoilCylinder = new THREE.Mesh(recoilCylinderGeometry, recoilMaterial);
topRecoilCylinder.rotation.x = Math.PI / 2;
topRecoilCylinder.position.set(0, 1.2, 9);
topRecoilCylinder.castShadow = true;
recoilGroup.add(topRecoilCylinder);

const bottomRecoilCylinder = new THREE.Mesh(recoilCylinderGeometry, recoilMaterial);
bottomRecoilCylinder.rotation.x = Math.PI / 2;
bottomRecoilCylinder.position.set(0, -1.2, 9);
bottomRecoilCylinder.castShadow = true;
recoilGroup.add(bottomRecoilCylinder);

// Hydraulic lines
const createHydraulicLine = (startPos, endPos) => {
const direction = new THREE.Vector3().subVectors(endPos, startPos);
const length = direction.length();

const lineGeometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.7
});

const line = new THREE.Mesh(lineGeometry, lineMaterial);
line.position.copy(startPos.clone().add(direction.clone().multiplyScalar(0.5)));

// Orient the cylinder to point from start to end
line.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
);

return line;
};

recoilGroup.add(createHydraulicLine(
new THREE.Vector3(0.5, 1.2, 0),
new THREE.Vector3(0.5, 0, 0)
));

recoilGroup.add(createHydraulicLine(
new THREE.Vector3(-0.5, -1.2, 0),
new THREE.Vector3(-0.5, 0, 0)
));

barrelGroup.add(recoilGroup);

// Add barrel tip for firing calculations
const barrelTipGeometry = new THREE.SphereGeometry(0.1, 8, 8);
const barrelTipMaterial = new THREE.MeshBasicMaterial({
color: 0xff0000,
visible: false
});
barrelTip = new THREE.Mesh(barrelTipGeometry, barrelTipMaterial);
barrelTip.position.set(0, 1, 9);
artilleryBarrel.add(barrelTip);

// Add the barrel group to the elevation group
elevationGroup.add(barrelGroup);

// Add the complete elevation group to the main artillery group
artillery.add(elevationGroup);

// Save a reference so we can later update its rotation
elevationGroupReference = elevationGroup;
initialGroupRotationX = elevationGroupReference.rotation.x;

const trunnionGroup = new THREE.Group();
trunnionGroup.position.set(0, 4, 0);

const trunnionGeometry = new THREE.CylinderGeometry(0.8, 0.8, 5, 16);
const trunnionMaterial = new THREE.MeshStandardMaterial({
color: 0x444444,
roughness: 0.4,
metalness: 0.6
});
const trunnion = new THREE.Mesh(trunnionGeometry, trunnionMaterial);
trunnion.rotation.x = Math.PI / 2;
trunnion.castShadow = true;
trunnionGroup.add(trunnion);

// Add bearing caps on each end
const bearingGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.4, 16);
const bearingMaterial = new THREE.MeshStandardMaterial({
color: 0x333333,
roughness: 0.3,
metalness: 0.8
});

const leftBearing = new THREE.Mesh(bearingGeometry, bearingMaterial);
leftBearing.rotation.x = Math.PI / 2;
leftBearing.position.set(0, 0, 2.7);
trunnionGroup.add(leftBearing);

const rightBearing = new THREE.Mesh(bearingGeometry, bearingMaterial);
rightBearing.rotation.x = Math.PI / 2;
rightBearing.position.set(0, 0, -2.7);
trunnionGroup.add(rightBearing);

artillery.add(trunnionGroup);



// Add control panel to the side
const controlPanelGroup = new THREE.Group();
controlPanelGroup.position.set(3.5, 3, -3);

const panelGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
const panelMaterial = new THREE.MeshStandardMaterial({
color: 0x333333,
roughness: 0.5,
metalness: 0.6
});
const panel = new THREE.Mesh(panelGeometry, panelMaterial);
controlPanelGroup.add(panel);

// Add control knobs and dials
const knobGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
const knobMaterial = new THREE.MeshStandardMaterial({
color: 0xdddddd,
roughness: 0.3,
metalness: 0.7
});

for (let y = -0.5; y <= 0.5; y += 0.5) {
for (let x = -0.3; x <= 0.3; x += 0.3) {
    const knob = new THREE.Mesh(knobGeometry, knobMaterial);
    knob.position.set(x, y, 0.15);
    knob.rotation.x = Math.PI / 2;
    controlPanelGroup.add(knob);
}
}

artillery.add(controlPanelGroup);

//---------------------------
// Position and add the artillery to the scene
//---------------------------
artillery.position.copy(gameState.positions.battery);
scene.add(artillery);

// Create the battery mesh (for reference)
const batteryGeo = new THREE.CylinderGeometry(2, 2, 0.5, 32);
const batteryMat = new THREE.MeshLambertMaterial({ color: 0x0000ff });
batteryMesh = new THREE.Mesh(batteryGeo, batteryMat);
batteryMesh.position.copy(gameState.positions.battery);
batteryMesh.position.y = 0.25;
batteryMesh.visible = false; // Hide the reference mesh
scene.add(batteryMesh);

// Add ground plate beneath the artillery
const groundPlateGeometry = new THREE.CylinderGeometry(6, 6, 0.2, 24);
const groundPlateMaterial = new THREE.MeshStandardMaterial({
color: 0x555555,
roughness: 0.8,
metalness: 0.2
});
const groundPlate = new THREE.Mesh(groundPlateGeometry, groundPlateMaterial);
groundPlate.position.copy(gameState.positions.battery);
groundPlate.position.y = 0.1;
groundPlate.receiveShadow = true;
scene.add(groundPlate);



// Add camouflage netting
const createCamoNet = () => {
const netGroup = new THREE.Group();
netGroup.position.copy(gameState.positions.battery);
netGroup.position.y = 8;

// Create a cloth-like mesh for the netting
const netGeometry = new THREE.PlaneGeometry(20, 20, 10, 10);

// Apply random displacement to vertices to make it look like cloth
const positions = netGeometry.attributes.position.array;
for (let i = 0; i < positions.length; i += 3) {
    // Don't displace the edges too much to keep it tent-like
    const x = positions[i];
    const z = positions[i + 2];
    const distFromCenter = Math.sqrt(x * x + z * z) / 10;
    
    // More displacement in the middle, less at the edges
    const displacementFactor = 1 - distFromCenter;
    
    // Apply random displacement to y-coordinate (height)
    positions[i + 1] += (Math.random() - 0.5) * 2 * displacementFactor;
    
    // Small random displacement to x and z for wrinkles
    positions[i] += (Math.random() - 0.5) * 0.5 * displacementFactor;
    positions[i + 2] += (Math.random() - 0.5) * 0.5 * displacementFactor;
}

// Update the geometry
netGeometry.computeVertexNormals();

const netMaterial = new THREE.MeshStandardMaterial({
    color: 0x4D5D53,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    roughness: 1.0,
    metalness: 0.0
});

const net = new THREE.Mesh(netGeometry, netMaterial);
net.rotation.x = -Math.PI / 2;
net.position.y = 0;
net.castShadow = true;
netGroup.add(net);

// Support poles for the netting
const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 10, 8);
const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513,
    roughness: 0.8,
    metalness: 0.1
});

// Add poles at the corners
const polePositions = [
    [-9, -9], [9, -9], [9, 9], [-9, 9]
];

polePositions.forEach(pos => {
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(pos[0], -5, pos[1]);
    pole.castShadow = true;
    netGroup.add(pole);
});

return netGroup;
};



// Add smoke and fire effects for when firing
const createFireEffect = () => {
const fireGroup = new THREE.Group();

// Position at the barrel tip
const barrelTipWorldPos = new THREE.Vector3();
barrelTip.getWorldPosition(barrelTipWorldPos);
fireGroup.position.copy(barrelTipWorldPos);

// Create particle system for fire
const fireGeometry = new THREE.BufferGeometry();
const fireCount = 100;
const firePositions = new Float32Array(fireCount * 3);
const fireSizes = new Float32Array(fireCount);

for (let i = 0; i < fireCount; i++) {
    const i3 = i * 3;
    firePositions[i3] = 0;
    firePositions[i3 + 1] = 0;
    firePositions[i3 + 2] = 0;
    fireSizes[i] = Math.random() * 2 + 1;
}

fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
fireGeometry.setAttribute('size', new THREE.BufferAttribute(fireSizes, 1));

// Create a simple material for the fire effect
const fireMaterial = new THREE.PointsMaterial({
    size: 2,
    color: 0xff5500,
    transparent: true,
    opacity: 0.8,
    depthWrite: false
});

const fire = new THREE.Points(fireGeometry, fireMaterial);
fire.visible = false; // Only visible when firing
fireGroup.add(fire);

return fireGroup;
};

// Create fire effect but don't add to scene yet - will be added when firing
const fireEffect = createFireEffect();

// Store references for animation and interaction
artillery.fireEffect = fireEffect;
artillery.barrelTip = barrelTip;
artillery.artilleryBarrel = artilleryBarrel;
}


function createTargetMesh() {
let targetGeo, targetMat;
if (gameState.targetType === 'aircraft') {
targetGeo = new THREE.ConeGeometry(10, 15, 10);
targetMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
targetMesh = new THREE.Mesh(targetGeo, targetMat);
targetMesh.rotation.x = Math.PI / 2;
targetMesh.position.copy(gameState.positions.target);
targetMesh.position.y = 1.5; 
} else if (gameState.targetType === 'armoredVehicles') {
targetGeo = new THREE.BoxGeometry(10, 15, 10);
targetMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
targetMesh = new THREE.Mesh(targetGeo, targetMat);
targetMesh.position.copy(gameState.positions.target);
targetMesh.position.y = 1.5;
} else { 
targetGeo = new THREE.BoxGeometry(10, 15, 10);
targetMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
targetMesh = new THREE.Mesh(targetGeo, targetMat);
targetMesh.position.copy(gameState.positions.target);
targetMesh.position.y = 1.5;
}
targetMesh.geometry.computeBoundingSphere();
targetMesh.castShadow = true;
targetMesh.receiveShadow = true;
scene.add(targetMesh);
}
function setupEventListeners() {

startButton.addEventListener('click', startGame);
tutorialButton.addEventListener('click', () => {
tutorialContainer.style.display = 'block';
});
closeTutorial.addEventListener('click', () => {
tutorialContainer.style.display = 'none';
});
elevationInput.addEventListener('input', () => {
const value = parseFloat(elevationInput.value);
if (!isNaN(value)) {
    elevationSlider.value = value;
    updateArtilleryElevation(value);
}
});
elevationSlider.addEventListener('input', () => {
const value = parseFloat(elevationSlider.value);
elevationInput.value = value;
updateArtilleryElevation(value);
});
azimuthInput.addEventListener('input', () => {
const value = parseFloat(azimuthInput.value);
if (!isNaN(value)) {
    azimuthSlider.value = value;
    updateArtilleryAzimuth(value);
}
});
azimuthSlider.addEventListener('input', () => {
const value = parseFloat(azimuthSlider.value);
azimuthInput.value = value;
updateArtilleryAzimuth(value);
});
fireButton.addEventListener('click', fireShell);
chartButton.addEventListener('click', () => {
commanderChart.style.display = 'block';
updateChartMap();
});
closeChart.addEventListener('click', () => {
commanderChart.style.display = 'none';
});
toggleTriangle.addEventListener('click', () => {
const triangleElement = document.getElementById('chart-triangle');
if (triangleElement) {
    triangleElement.style.display = triangleElement.style.display === 'none' ? 'block' : 'none';
}
});
toggleRuler.addEventListener('click', () => {
bearingRuler.style.display = bearingRuler.style.display === 'none' ? 'block' : 'none';
});
giveUpButton.addEventListener('click', () => {
if (confirm("Are you sure you want to give up? This will end the current mission.")) {
    endGame(false, "Mission Aborted");
}
});
restartButton.addEventListener('click', resetGame);

document.addEventListener('keydown', (event) => {
const currentTime = Date.now();
if (currentTime - gameState.lastKeyTime > 1000) {
    gameState.secretCode = "";
}
gameState.lastKeyTime = currentTime;
gameState.secretCode += event.key.toUpperCase();
if (gameState.secretCode.includes("HAJJ")) {
    gameState.debugMode = true;
    showDebugInfo();
}
bearingRuler.addEventListener('mousedown', startBearingMeasurement);
document.addEventListener('mousemove', updateBearingMeasurement);
document.addEventListener('mouseup', endBearingMeasurement);

});
// Attach bullet drag listeners
document.querySelectorAll('.bullet').forEach(b => {
    b.addEventListener('dragstart', ev => {
        ev.dataTransfer.setData('text/plain', b.dataset.type);
        ev.target.classList.add('dragging');
    });
     b.addEventListener('dragend', ev => {
        ev.target.classList.remove('dragging');
    });
});

// Chamber drag and drop listeners
chamberInterior.addEventListener('dragover', ev => {
    console.log('Dragover event fired on chamberInterior.'); // <-- Does this log appear when you drag over?
    console.log('gameState.currentChamberedBulletType:', gameState.currentChamberedBulletType); // <-- What is the value of the state variable?
    console.log('Condition !gameState.currentChamberedBulletType:', !gameState.currentChamberedBulletType); // <-- Is this condition true?

    // Allow drop if chamber is empty
    if (!gameState.currentChamberedBulletType) {
        console.log('Condition met: Chamber is empty. Calling ev.preventDefault().'); // <-- Does this log appear?
        ev.preventDefault(); // Prevent default to allow drop
         chamberInterior.classList.add('drag-over');
    } else {
        console.log('Condition NOT met: Chamber is NOT empty. Not calling ev.preventDefault(). Drop will be blocked by browser.'); // <-- Does this log appear instead?
    }
});


 chamberInterior.addEventListener('dragleave', () => {
    chamberInterior.classList.remove('drag-over');
});

chamberInterior.addEventListener('drop', ev => {
    ev.preventDefault(); // Prevent default browser drop behavior
     chamberInterior.classList.remove('drag-over');

    const type = ev.dataTransfer.getData('text/plain');
    // Only allow drop if the chamber is empty
    if (!gameState.currentChamberedBulletType) {
        const bulletInfo = bulletTypeMapping[type];
        if (bulletInfo) {
            // Create a visual representation of the chambered bullet
            const chamberedBulletEl = document.createElement('div');
            chamberedBulletEl.className = 'bullet ' + type; // Use the bullet styles
            Object.assign(chamberedBulletEl.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                margin: '0', // Override potential margin from .bullet class
                pointerEvents: 'none' // Prevent dragging the chambered bullet
            });
             const originalBullet = document.querySelector(`.bullet[data-type="${type}"]`);
             const originalScratch = originalBullet ? originalBullet.querySelector('.scratch') : null;
             if(originalScratch){
                 const chamberedScratch = document.createElement('div');
                 chamberedScratch.className = 'scratch';
                 chamberedBulletEl.appendChild(chamberedScratch);
             }


            // Clear the slot before adding the new bullet
            chamberSlot.innerHTML = '';
            chamberSlot.appendChild(chamberedBulletEl);


            // Update game state
            gameState.currentChamberedBulletType = type;
            gameState.shellType = bulletInfo.shell;

            addMessage(`Chambered: ${type} (${gameState.shellType})`);
        } else {
            addMessage(`Unknown bullet type: ${type}`);
        }
    } else {
         addMessage("Chamber is already loaded. Fire to clear.");
    }
});


}
function setupCalculator() {
let currentExpression = "";
calcButtons.forEach(button => {
button.addEventListener('click', () => {
    const value = button.textContent;
    if (value === "=") {
        try {
            let expression = currentExpression
                .replace(/sin\(/g, "Math.sin(Math.PI/180*")
                .replace(/cos\(/g, "Math.cos(Math.PI/180*")
                .replace(/tan\(/g, "Math.tan(Math.PI/180*");
            const result = eval(expression);
            calcDisplay.textContent = result;
            currentExpression = result.toString();
        } catch (error) {
            calcDisplay.textContent = "Error";
            currentExpression = "";
        }
    } else if (value === "C") {
        calcDisplay.textContent = "0";
        currentExpression = "";
    } else {
        if (currentExpression === "0" || calcDisplay.textContent === "Error" || calcDisplay.textContent === "0") {
            currentExpression = value;
        } else {
            currentExpression += value;
        }
        calcDisplay.textContent = currentExpression;
    }
});
});
}
function startGame() {
gameState.batteryName = batteryNameInput.value || "Alpha Battery";
gameState.difficulty = difficultySelect.value;
const settings = difficultySettings[gameState.difficulty];
gameState.maxShells = settings.shells;
gameState.shells = settings.shells;
gameState.timeLimit = settings.timeLimit;
gameState.timeRemaining = settings.timeLimit;
gameState.showTrajectory = settings.showTrajectory;
generateMission();
homeScreen.style.display = 'none';
hud.style.display = 'block';
controlsPanel.style.display = 'block';  
messageLog.style.display = 'block';
shellCounter.style.display = 'block';
if (gameState.timeLimit !== Infinity) {
timerDisplay.style.display = 'block';
startTimer();
}
updateShellCounter();
gameState.started = true;
addMessage(`Mission Control: Welcome, ${gameState.batteryName}. Your mission is to eliminate the enemy ${gameState.targetType === 'aircraft' ? 'aircraft' : gameState.targetType === 'armoredVehicles' ? 'armored vehicle' : 'building'}.`);
addMessage(`Forward Observer: This is Observer. I have eyes on the target. Sending coordinates now.`);
updateFOReport();
}
function generateMission() {
    const targetTypes = ['aircraft', 'armoredVehicles', 'buildings'];
    gameState.targetType = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    gameState.shellType = shellTypes[gameState.targetType];
  
    // Set battery at origin
    gameState.positions.battery.set(0, 0, 0);
  
    // Set a safe max distance to avoid overflowing chart
    const maxMapDistance = 350; // in pixels
    const scale = 350 / maxMapDistance; // actual game units per px
    const maxWorldDistance = maxMapDistance / scale;
  
    // Generate target direction and distance (closer to center)
    const targetAngle = Math.random() * Math.PI * 2;
    const targetDistance = 600 + Math.random() * 600; // 600-1200ft
    const targetX = Math.cos(targetAngle) * targetDistance;
    const targetZ = Math.sin(targetAngle) * targetDistance;
    gameState.positions.target.set(targetX, 0, targetZ);
    gameState.distances.batteryToTarget = targetDistance;
  
    // Place FO somewhere between battery and target (closer to target)
    const foFraction = 0.6 + Math.random() * 0.3; // 60% to 90% toward target
    const foX = targetX * foFraction;
    const foZ = targetZ * foFraction;
    gameState.positions.forwardObserver.set(foX, 0, foZ);
  
    // Recalculate distances
    const batteryToFODistance = gameState.positions.forwardObserver.distanceTo(gameState.positions.battery);
    const foToTargetDistance = gameState.positions.forwardObserver.distanceTo(gameState.positions.target);
  
    gameState.distances.batteryToFO = batteryToFODistance;
    gameState.distances.foToTarget = foToTargetDistance;
  
    // Use Law of Cosines to find angle at FO
    const a = foToTargetDistance;
    const b = batteryToTargetDistance;
    const c = batteryToFODistance;
    const angleAtFO = Math.acos((b ** 2 + c ** 2 - a ** 2) / (2 * b * c));
    const angleAtBattery = Math.acos((a ** 2 + c ** 2 - b ** 2) / (2 * a * c));
    const angleAtTarget = Math.acos((b ** 2 + a ** 2 - c ** 2) / (2 * b * a));
  
    gameState.angles.atFO = angleAtFO * 180 / Math.PI;
    gameState.angles.atBattery = angleAtBattery * 180 / Math.PI;
    gameState.angles.atTarget = angleAtTarget * 180 / Math.PI;
  
    // Solution
    gameState.solution.elevation = 4 * (gameState.distances.batteryToTarget / 1400);
  
    const targetVector = new THREE.Vector3().subVectors(
      gameState.positions.target,
      gameState.positions.battery
    );
    gameState.solution.azimuth = (Math.atan2(targetVector.x, targetVector.z) * 180 / Math.PI + 360) % 360;
  
    createTargetMesh();
    updateMissionInfo();
  }
function updateMissionInfo() {
    const rank = getMilitaryRank(gameState.score)
missionInfo.innerHTML = `
<h3>Data Information</h3>
<p>Battery: ${gameState.batteryName}</p>
<p>Difficulty: ${difficultySettings[gameState.difficulty].name}</p>
<p>Score: ${gameState.score}</p>
<p>Wins: ${gameState.wins}</p>
<p>Rank: ${rank}</p>
`;


    const formulasHTML = `
      Variables:
      X = ${gameState.batteryName}
      Y = Forward Observer
      Z = Target
  
      Law of Cosines:
      a² = b² + c² - 2bc·cos(X)
      b² = a² + c² - 2ac·cos(Y)
      c² = a² + b² - 2ab·cos(Z)
  
      Ballistics Formula:
      Elevation θ = 4 × (distance / 1400ft)
    `;
    document.getElementById('chart-formulas').innerHTML = formulasHTML;

}

function updateFOReport() {
foReport.innerHTML = `
<p>${gameState.batteryName}, this is Observer. I've pushed out approximately ${gameState.distances.batteryToFO.toFixed(1)} ft from your position to get a clear line of sight. Out here, I've confirmed our enemy—a ${targetTypes[gameState.targetType][Math.floor(Math.random() * targetTypes[gameState.targetType].length)]}—just as the intel described.</p>
<p>My measurements show:</p>
<ul>
    <li>Distance from Battery to Forward Observer: ${gameState.distances.batteryToFO.toFixed(1)} ft</li>
    <li>Distance from Battery to Target: ${gameState.distances.batteryToTarget.toFixed(1)} ft</li>
    <li>Angle at Forward Observer: ${gameState.angles.atFO.toFixed(1)}°</li>
</ul>
<p>Calculate the remaining distance and firing solution. Over.</p>
`;
}
function updateChartMap() {

chartMap.innerHTML = '';
chartMap.style.position = 'relative';
chartMap.style.height = '400px';
const maxDistance = Math.max(
gameState.distances.batteryToFO,
gameState.distances.batteryToTarget,
gameState.distances.foToTarget
);
const scale = 350 / maxDistance;
const batteryElement = document.createElement('div');
batteryElement.style.position = 'absolute';
batteryElement.style.width = '10px';
batteryElement.style.height = '10px';
batteryElement.style.borderRadius = '50%';
batteryElement.style.backgroundColor = 'blue';
batteryElement.style.left = '200px';
batteryElement.style.top = '200px';
batteryElement.style.transform = 'translate(-50%, -50%)';
batteryElement.title = gameState.batteryName;
chartMap.appendChild(batteryElement);
const batteryLabel = document.createElement('div');
batteryLabel.style.position = 'absolute';
batteryLabel.style.left = '205px';
batteryLabel.style.top = '195px';
batteryLabel.style.color = '#33ff33';
batteryLabel.textContent = 'X';
chartMap.appendChild(batteryLabel);
const foX = 200 + gameState.positions.forwardObserver.x * scale;
const foZ = 200 - gameState.positions.forwardObserver.z * scale;
const foElement = document.createElement('div');
foElement.style.position = 'absolute';
foElement.style.width = '10px';
foElement.style.height = '10px';
foElement.style.borderRadius = '50%';
foElement.style.backgroundColor = 'green';
foElement.style.left = foX + 'px';
foElement.style.top = foZ + 'px';
foElement.style.transform = 'translate(-50%, -50%)';
foElement.title = 'Forward Observer';
chartMap.appendChild(foElement);
const foLabel = document.createElement('div');
foLabel.style.position = 'absolute';
foLabel.style.left = (foX + 5) + 'px';
foLabel.style.top = (foZ - 5) + 'px';
foLabel.style.color = '#33ff33';
foLabel.textContent = 'Y';
chartMap.appendChild(foLabel);
const targetX = 200 + gameState.positions.target.x * scale;
const targetZ = 200 - gameState.positions.target.z * scale;
const targetElement = document.createElement('div');
targetElement.style.position = 'absolute';
targetElement.style.width = '10px';
targetElement.style.height = '10px';
targetElement.style.borderRadius = '50%';
targetElement.style.backgroundColor = 'red';
targetElement.style.left = targetX + 'px';
targetElement.style.top = targetZ + 'px';
targetElement.style.transform = 'translate(-50%, -50%)';
targetElement.title = 'Target';
chartMap.appendChild(targetElement);
const targetLabel = document.createElement('div');
targetLabel.style.position = 'absolute';
targetLabel.style.left = (targetX + 5) + 'px';
targetLabel.style.top = (targetZ - 5) + 'px';
targetLabel.style.color = '#33ff33';
targetLabel.textContent = 'Z';
chartMap.appendChild(targetLabel);
const triangleElement = document.createElement('div');
triangleElement.id = 'chart-triangle';
triangleElement.style.position = 'absolute';
triangleElement.style.left = '0';
triangleElement.style.top = '0';
triangleElement.style.width = '100%';
triangleElement.style.height = '100%';
triangleElement.style.pointerEvents = 'none';
chartMap.appendChild(triangleElement);
const svgNS = "http://www.w3.org/2000/svg"
const svg = document.createElementNS(svgNS, "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
svg.style.position = 'absolute';
svg.style.left = '0';
svg.style.top = '0';
svg.style.pointerEvents = 'none';
const line1 = document.createElementNS(svgNS, "line");
line1.setAttribute("x1", "200");
line1.setAttribute("y1", "200");
line1.setAttribute("x2", foX);
line1.setAttribute("y2", foZ);
line1.setAttribute("stroke", "#33ff33");
line1.setAttribute("stroke-width", "1");
line1.setAttribute("stroke-dasharray", "5,5");
svg.appendChild(line1);
const line2 = document.createElementNS(svgNS, "line");
line2.setAttribute("x1", "200");
line2.setAttribute("y1", "200");
line2.setAttribute("x2", targetX);
line2.setAttribute("y2", targetZ);
line2.setAttribute("stroke", "#33ff33");
line2.setAttribute("stroke-width", "1");
line2.setAttribute("stroke-dasharray", "5,5");
svg.appendChild(line2);
const line3 = document.createElementNS(svgNS, "line");
line3.setAttribute("x1", foX);
line3.setAttribute("y1", foZ);
line3.setAttribute("x2", targetX);
line3.setAttribute("y2", targetZ);
line3.setAttribute("stroke", "#33ff33");
line3.setAttribute("stroke-width", "1");
line3.setAttribute("stroke-dasharray", "5,5");
svg.appendChild(line3);
triangleElement.appendChild(svg);
const batteryToFOLabel = document.createElement('div');
batteryToFOLabel.style.position = 'absolute';
batteryToFOLabel.style.left = (200 + (foX - 200) / 2) + 'px';
batteryToFOLabel.style.top = (200 + (foZ - 200) / 2) + 'px';
batteryToFOLabel.style.color = '#ffff33';
batteryToFOLabel.style.backgroundColor = 'rgba(0, 20, 0, 0.7)';
batteryToFOLabel.style.padding = '2px';
batteryToFOLabel.style.borderRadius = '3px';
batteryToFOLabel.textContent = 'c: ' + gameState.distances.batteryToFO.toFixed(1) + ' ft';
triangleElement.appendChild(batteryToFOLabel);
const batteryToTargetLabel = document.createElement('div');
batteryToTargetLabel.style.position = 'absolute';
batteryToTargetLabel.style.left = (200 + (targetX - 200) / 2) + 'px';
batteryToTargetLabel.style.top = (200 + (targetZ - 200) / 2) + 'px';
batteryToTargetLabel.style.color = '#ffff33';
batteryToTargetLabel.style.backgroundColor = 'rgba(0, 20, 0, 0.7)';
batteryToTargetLabel.style.padding = '2px';
batteryToTargetLabel.style.borderRadius = '3px';
batteryToTargetLabel.textContent = 'b: ' + '???';
triangleElement.appendChild(batteryToTargetLabel);
const foToTargetLabel = document.createElement('div');
foToTargetLabel.style.position = 'absolute';
foToTargetLabel.style.left = (foX + (targetX - foX) / 2) + 'px';
foToTargetLabel.style.top = (foZ + (targetZ - foZ) / 2) + 'px';
foToTargetLabel.style.color = '#ffff33';
foToTargetLabel.style.backgroundColor = 'rgba(0, 20, 0, 0.7)';
foToTargetLabel.style.padding = '2px';
foToTargetLabel.style.borderRadius = '3px';
foToTargetLabel.textContent = 'a: ' + gameState.distances.foToTarget.toFixed(1) + ' ft';
triangleElement.appendChild(foToTargetLabel);
bearingRuler.style.left = foX + 'px';
bearingRuler.style.top = foZ + 'px';
bearingRuler.innerHTML = '';
for (let i = 0; i < 360; i += 10) {
const mark = document.createElement('div');
mark.style.position = 'absolute';
mark.style.left = '50%';
mark.style.top = '0';
mark.style.width = '1px';
mark.style.height = '10px';
mark.style.backgroundColor = '#33ff33';
mark.style.transform = `rotate(${i}deg) translateX(-50%)`;
mark.style.transformOrigin = 'bottom center';
bearingRuler.appendChild(mark);
if (i % 30 === 0) {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.left = '50%';
    label.style.top = '10px';
    label.style.color = '#33ff33';
    label.style.fontSize = '10px';
    label.style.transform = `rotate(${i}deg) translateX(-50%) translateY(-100%) rotate(-${i}deg)`;
    label.style.transformOrigin = 'bottom center';
    label.textContent = i.toString();
    bearingRuler.appendChild(label);
}
}

const north = document.createElement('div');
north.style.position = 'absolute';
north.style.left = '20px';
north.style.top = '20px';
north.style.color = '#33ff33';
north.style.fontSize = '16px';
north.textContent = 'N';
chartMap.appendChild(north);
        const east = document.createElement('div');
east.style.position = 'absolute';
east.style.left = '380px';
east.style.top = '20px';
east.style.color = '#33ff33';
east.style.fontSize = '16px';
east.textContent = 'E';
chartMap.appendChild(east);
const south = document.createElement('div');
south.style.position = 'absolute';
south.style.left = '20px';
south.style.top = '380px';
south.style.color = '#33ff33';
south.style.fontSize = '16px';
south.textContent = 'S';
chartMap.appendChild(south);
const west = document.createElement('div');
west.style.position = 'absolute';
west.style.left = '380px';
west.style.top = '380px';
west.style.color = '#33ff33';
west.style.fontSize = '16px';
west.textContent = 'W';
chartMap.appendChild(west);
const coordInfo = document.createElement('div');
coordInfo.style.position = 'absolute';
coordInfo.style.left = '1--0px';
coordInfo.style.bottom = '10px';
coordInfo.style.color = '#33ff33';
coordInfo.style.fontSize = '12px';
coordInfo.textContent = 'Grid: 1 square = 100 ft';
chartMap.appendChild(coordInfo);
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.width = '2px';
crosshair.style.height = '100%';
crosshair.style.backgroundColor = '#33ff33';
crosshair.style.left = '50%';
crosshair.style.transform = 'translateX(-1px)';
bearingRuler.appendChild(crosshair);

const crosshairVertical = document.createElement('div');
crosshairVertical.style.position = 'absolute';
crosshairVertical.style.width = '100%';
crosshairVertical.style.height = '2px';
crosshairVertical.style.backgroundColor = '#33ff33';
crosshairVertical.style.top = '50%';
crosshairVertical.style.transform = 'translateY(-1px)';
bearingRuler.appendChild(crosshairVertical);

// Add center point
const centerPoint = document.createElement('div');
centerPoint.style.position = 'absolute';
centerPoint.style.width = '8px';
centerPoint.style.height = '8px';
centerPoint.style.backgroundColor = '#33ff33';
centerPoint.style.borderRadius = '50%';
centerPoint.style.left = '50%';
centerPoint.style.top = '50%';
centerPoint.style.transform = 'translate(-4px, -4px)';
bearingRuler.appendChild(centerPoint);
}
function updateArtilleryElevation(elevation) {
const minElevation = 0;          
elevation = Math.max(minElevation, elevation);
gameState.currentElevation = elevation;


const deltaRad = (elevation - minElevation) * Math.PI / 180;


elevationGroupReference.rotation.x = initialGroupRotationX - deltaRad;

elevationInput.value = elevation;
elevationSlider.value = elevation;
}
function updateArtilleryAzimuth(azimuth) {
gameState.currentAzimuth = azimuth;
artillery.rotation.y = azimuth * Math.PI / 180;
}
function createShell() {
if (shell) scene.remove(shell);
if (shellTrajectory) scene.remove(shellTrajectory);
const shellGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
shell = new THREE.Mesh(shellGeometry, shellMaterial);
shell.castShadow = true;
const artilleryPosition = new THREE.Vector3();
artillery.getWorldPosition(artilleryPosition);
const barrelDirection = new THREE.Vector3(0, 0, 1);
barrelDirection.applyQuaternion(artilleryBarrel.quaternion);
barrelDirection.applyQuaternion(artillery.quaternion);
const barrelPosition = new THREE.Vector3();
artilleryBarrel.getWorldPosition(barrelPosition);
const barrelEndPosition = barrelPosition.clone().add(
barrelDirection.clone().multiplyScalar(7.5)
);
shell.position.copy(barrelEndPosition);
shell.quaternion.setFromUnitVectors(
new THREE.Vector3(0, 1, 0), 
barrelDirection 
);
scene.add(shell);
if (gameState.showTrajectory) {
const trajectoryGeometry = new THREE.BufferGeometry();
const trajectoryMaterial = new THREE.LineBasicMaterial({ 
color: 0xffff00,
transparent: true,
opacity: 0.5
});
shellTrajectory = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
scene.add(shellTrajectory);
}
return barrelDirection; 
}


// Create muzzle flash effect
function createMuzzleFlash() {
const flashGroup = new THREE.Group();

// Create a bright center
const flashCoreGeometry = new THREE.SphereGeometry(1.2, 16, 16);
const flashCoreMaterial = new THREE.MeshBasicMaterial({
color: 0xffff99,
transparent: true,
opacity: 0.9
});
const flashCore = new THREE.Mesh(flashCoreGeometry, flashCoreMaterial);
flashGroup.add(flashCore);

// Create outer glow
const flashOuterGeometry = new THREE.SphereGeometry(2, 16, 16);
const flashOuterMaterial = new THREE.MeshBasicMaterial({
color: 0xff5500,
transparent: true,
opacity: 0.7
});
const flashOuter = new THREE.Mesh(flashOuterGeometry, flashOuterMaterial);
flashGroup.add(flashOuter);

// Add some random spikes for more dramatic effect
for (let i = 0; i < 8; i++) {
const spikeGeometry = new THREE.ConeGeometry(0.5, 3, 8);
const spikeMaterial = new THREE.MeshBasicMaterial({
    color: 0xff7700,
    transparent: true,
    opacity: 0.8
});

const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);

// Random orientation
spike.rotation.x = Math.random() * Math.PI;
spike.rotation.y = Math.random() * Math.PI;
spike.rotation.z = Math.random() * Math.PI;

flashGroup.add(spike);
}

// Position the flash at the tip of the barrel
flashGroup.position.set(0, 0, 10); // Adjust this value to match your barrel length

// Make it not visible by default
flashGroup.visible = false;

return flashGroup;
}

// Create smoke effect
function createSmokeEffect() {
const smokeGroup = new THREE.Group();

// Position the smoke at the tip of the barrel
smokeGroup.position.set(0, 0, 10); // Adjust this value to match your barrel length

// Create multiple smoke particles
for (let i = 0; i < 20; i++) {
const smokeGeometry = new THREE.SphereGeometry(1, 8, 8);
const smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.7
});

const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);

// Random initial position slightly in front of barrel
smoke.position.set(
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.5
);

// Store velocity for animation
smoke.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    Math.random() * 1.5,
    (Math.random() - 0.5) * 2
);

smokeGroup.add(smoke);
}

return smokeGroup;
}


// Play firing sound
function playFiringSound() {
// Check if audio is already initialized
if (!window.audioContext) {
try {
    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
    console.warn("Web Audio API not supported:", e);
    return;
}
}

// Create oscillator for simple sound effect
const oscillator = window.audioContext.createOscillator();
const gainNode = window.audioContext.createGain();

oscillator.type = 'sawtooth';
oscillator.frequency.setValueAtTime(150, window.audioContext.currentTime);
oscillator.frequency.exponentialRampToValueAtTime(40, window.audioContext.currentTime + 0.5);

gainNode.gain.setValueAtTime(1, window.audioContext.currentTime);
gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.5);

oscillator.connect(gainNode);
gainNode.connect(window.audioContext.destination);

oscillator.start();
oscillator.stop(window.audioContext.currentTime + 0.5);
}
// For a more realistic artillery firing effect, we need to modify the createArtillery function
// to add some additional properties that will be used during firing

function enhanceArtilleryForFiring() {
// Add ejection port for shell casings
const ejectionPortGroup = new THREE.Group();
ejectionPortGroup.position.set(0, 0, -2); // Position at the rear of the barrel

const portGeometry = new THREE.BoxGeometry(1, 1, 0.5);
const portMaterial = new THREE.MeshStandardMaterial({
color: 0x222222,
roughness: 0.3,
metalness: 0.8
});

const ejectionPort = new THREE.Mesh(portGeometry, portMaterial);
ejectionPortGroup.add(ejectionPort);

// Add to the barrel group
artilleryBarrel.add(ejectionPortGroup);

// Create shell casing template (will be cloned when firing)
const casingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12);
const casingMaterial = new THREE.MeshStandardMaterial({
color: 0xb5a642, // Brass color
roughness: 0.3,
metalness: 0.8
});

const shellCasingTemplate = new THREE.Mesh(casingGeometry, casingMaterial);
shellCasingTemplate.visible = false;
scene.add(shellCasingTemplate);

// Store reference for later use
artillery.shellCasingTemplate = shellCasingTemplate;
artillery.ejectionPort = ejectionPortGroup;

// Add hydraulic recoil system visualization
const recoilSystemGroup = new THREE.Group();

const cylinderGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
const cylinderMaterial = new THREE.MeshStandardMaterial({
color: 0x444444,
roughness: 0.4,
metalness: 0.7
});

const recoilCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
recoilCylinder.rotation.x = Math.PI / 2;
recoilCylinder.position.set(0, -1.5, 4);
recoilSystemGroup.add(recoilCylinder);

// Piston that will move during recoil
const pistonGeometry = new THREE.CylinderGeometry(0.35, 0.35, 8.5, 16);
const pistonMaterial = new THREE.MeshStandardMaterial({
color: 0x666666,
roughness: 0.3,
metalness: 0.8
});

const recoilPiston = new THREE.Mesh(pistonGeometry, pistonMaterial);
recoilPiston.rotation.x = Math.PI / 2;
recoilPiston.position.set(0, -1.5, 4);
recoilSystemGroup.add(recoilPiston);

// Store original position for animation
recoilPiston.userData.originalPosition = recoilPiston.position.clone();

// Add to artillery
artillery.add(recoilSystemGroup);
artillery.recoilPiston = recoilPiston;

// Create dust effect for when firing (will be activated during firing)
const dustGroup = new THREE.Group();
dustGroup.visible = false;

for (let i = 0; i < 30; i++) {
const dustGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
const dustMaterial = new THREE.MeshBasicMaterial({
    color: 0xccccaa,
    transparent: true,
    opacity: 0.4 + Math.random() * 0.3
});

const dust = new THREE.Mesh(dustGeometry, dustMaterial);

// Random position around the artillery
const angle = Math.random() * Math.PI * 2;
const radius = 3 + Math.random() * 3;
dust.position.set(
    Math.cos(angle) * radius,
    0.1 + Math.random() * 0.5,
    Math.sin(angle) * radius
);

// Store velocity for animation
dust.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    Math.random() * 1.5,
    (Math.random() - 0.5) * 2
);

// Store lifetime
dust.userData.lifetime = 1 + Math.random() * 1.5;
dust.userData.age = 0;

dustGroup.add(dust);
}

artillery.dustEffect = dustGroup;
scene.add(dustGroup);
}

// Call this function after creating the artillery
// enhanceArtilleryForFiring();

// Modify the fireShell function to include the enhanced effects
function fireShell() {
gameState.hitRegistered = false;
if (gameState.isFiring || gameState.shells <= 0) return;

let shellRemoved = false;
let animationFrameId = null;
if (gameState.isFiring || gameState.shells <= 0) return;

// Check if a bullet is chambered
if (!gameState.currentChamberedBulletType) {
    addMessage("Chamber is empty. Load a bullet first.");
    // Add a "Click!" sound or visual feedback for empty chamber
    return;
}


// Get barrel tip position for shell spawn
const barrelTipPosition = new THREE.Vector3();
barrelTip.getWorldPosition(barrelTipPosition);
if (barrelTipPosition.y < 1) {
barrelTipPosition.y = 1; 
}

// Create shell
const shellGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const shellMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
shell = new THREE.Mesh(shellGeometry, shellMaterial);
shell.position.copy(barrelTipPosition);
shell.quaternion.copy(artilleryBarrel.quaternion);
shell.rotation.x += Math.PI / 2; 
scene.add(shell);

const muzzleVelocity = 500;
const gravity = 24.8;
const dx = gameState.positions.target.x - barrelTipPosition.x;
const dz = gameState.positions.target.z - barrelTipPosition.z;
const d  = Math.sqrt(dx*dx + dz*dz);

function computeElevationForDistance(d, v, g) {
const ratio = (g * d) / (v * v);
if (ratio < -1 || ratio > 1) return null;
return 0.5 * Math.asin(ratio);
}

const elevationRad = gameState.currentElevation * Math.PI / 180;
if (gameState.currentElevation < 0 || gameState.currentElevation > 30) {    
addMessage("Invalid elevation! Must be between 0° and 30°");
scene.remove(shell);
gameState.isFiring = false;
return;
}

gameState.shells--;
updateShellCounter();
gameState.isFiring = true;
addMessage(`${gameState.batteryName}: FIRE!`);

const azimuthRad = gameState.currentAzimuth * Math.PI / 180;
console.log(`Auto‐elev: ${(elevationRad*180/Math.PI).toFixed(2)}°`);

const velocityX = muzzleVelocity * Math.cos(elevationRad) * Math.sin(azimuthRad);
const velocityY = muzzleVelocity * Math.sin(elevationRad);
const velocityZ = muzzleVelocity * Math.cos(elevationRad) * Math.cos(azimuthRad);
console.log(`Velocity components: X=${velocityX}, Y=${velocityY}, Z=${velocityZ}`);

const originalCameraPosition = camera.position.clone();
const shakeIntensity = 1;
const shakeDuration = 0.5; 
let shakeTime = 0;
const originalCameraTarget = controls.target.clone();
gameState.shells--;
    updateShellCounter();


    // Clear the chamber after firing
    chamberSlot.innerHTML = '';
    gameState.currentChamberedBulletType = null;
    gameState.shellType = null; // Clear shell type after firing
// ===== BARREL RECOIL ANIMATION =====
// Store original barrel position
const originalBarrelPosition = artilleryBarrel.position.clone();

// Recoil parameters
const recoilDistance = 6.0;
const recoilDuration = 0.2;
const returnDuration = 0.8;
let recoilTime = 0;

// Add muzzle flash effect - ATTACH TO BARREL
const muzzleFlash = createMuzzleFlash();
artilleryBarrel.add(muzzleFlash); // Attach to barrel instead of barrel tip

// Add smoke effect - ATTACH TO BARREL
const smokeEffect = createSmokeEffect();
artilleryBarrel.add(smokeEffect); // Attach to barrel instead of barrel tip

// Eject shell casing
ejectShellCasing();

// Activate dust effect
if (artillery.dustEffect) {
artillery.dustEffect.position.copy(artillery.position);
artillery.dustEffect.visible = true;

// Reset dust particles
artillery.dustEffect.children.forEach(dust => {
    dust.userData.age = 0;
    
    // Random position around the artillery
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 3;
    dust.position.set(
        Math.cos(angle) * radius,
        0.1 + Math.random() * 0.5,
        Math.sin(angle) * radius
    );
    
    dust.material.opacity = 0.4 + Math.random() * 0.3;
    dust.scale.set(1, 1, 1);
});
}

// Play firing sound
playFiringSound();

let time = 0;
const animate = () => {
const deltaTime = Math.min(0.05, clock.getDelta());
time += deltaTime;
let hitRegistered = false;
// Cleanup function for reuse
const cleanup = (position) => {
    if (hitRegistered) return;
    if (shellRemoved) return;
    shellRemoved = true;
    
    createExplosion(position.clone());
    scene.remove(shell);
    
    // Remove effects from barrel
    artilleryBarrel.remove(muzzleFlash);
    artilleryBarrel.remove(smokeEffect);
    
    // Cancel any pending animation frame
    setTimeout(() => {
        if (!hitRegistered) { // Only check if no direct hit has been registered
            const targetPos = new THREE.Vector3(
                gameState.positions.target.x,
                0,
                gameState.positions.target.z
            );
            const distance = position.distanceTo(targetPos);
    
            if (distance < 15) { // Within explosion radius
                safeHandleHit();
                hitRegistered = true;
            } else {
                handleMiss(distance);
            }
        }
    }, 200);
    
    // Reset camera & controls and do a delayed explosion check after 2000ms:
    setTimeout(() => {
        // Reset camera and controls
        controls.target.copy(originalCameraTarget);
        camera.position.copy(originalCameraPosition);
        controls.update();
    
        // Use explosion check again only if a hit was not already registered earlier
        if (!hitRegistered) {
            const targetPos = new THREE.Vector3(
                gameState.positions.target.x,
                0,
                gameState.positions.target.z
            );
            const distance = position.distanceTo(targetPos);
    
            if (distance < 15) { // Still within explosion radius
                safeHandleHit();;
            } else {
                handleMiss(distance);
            }
        }
        
        // Indicate that the firing action has finished
        gameState.isFiring = false;
    }, 2000);
};


// Timeout after 4 seconds
if (time >= 4) {
    cleanup(shell.position);
    return;
}

// Update shell position
const newX = barrelTipPosition.x + velocityX * time;
const newY = barrelTipPosition.y + velocityY * time - 0.5 * gravity * time * time;
const newZ = barrelTipPosition.z + velocityZ * time;
shell.position.set(newX, newY, newZ);

// ===== BARREL RECOIL ANIMATION =====
recoilTime += deltaTime;

if (recoilTime < recoilDuration) {
    // Recoil phase - move barrel backward
    const recoilProgress = recoilTime / recoilDuration;
    const recoilOffset = recoilDistance * recoilProgress;
    artilleryBarrel.position.z = originalBarrelPosition.z - recoilOffset;
    
    // Also animate recoil piston if it exists
    if (artillery.recoilPiston) {
        const pistonOrigPos = artillery.recoilPiston.userData.originalPosition;
        artillery.recoilPiston.position.z = pistonOrigPos.z - recoilOffset * 0.8;
    }
} else if (recoilTime < recoilDuration + returnDuration) {
    // Return phase - move barrel forward
    const returnProgress = (recoilTime - recoilDuration) / returnDuration;
    const returnOffset = recoilDistance * (1 - returnProgress);
    artilleryBarrel.position.z = originalBarrelPosition.z - returnOffset;
    
    // Also animate recoil piston
    if (artillery.recoilPiston) {
        const pistonOrigPos = artillery.recoilPiston.userData.originalPosition;
        artillery.recoilPiston.position.z = pistonOrigPos.z - returnOffset * 0.8;
    }
} else {
    // Reset to original position
    artilleryBarrel.position.copy(originalBarrelPosition);
    
    // Reset piston
    if (artillery.recoilPiston) {
        artillery.recoilPiston.position.copy(artillery.recoilPiston.userData.originalPosition);
    }
}

// Update muzzle flash (visible only briefly)
if (time < 0.1) {
    const barrelEndPosition = new THREE.Vector3();
    barrelTip.getWorldPosition(barrelEndPosition);
    muzzleFlash.position.copy(barrelEndPosition);
    muzzleFlash.visible = true;
    
    // Scale the flash for dramatic effect
    const flashScale = 1 + Math.random() * 0.5;
    muzzleFlash.scale.set(flashScale, flashScale, flashScale);
} else {
    muzzleFlash.visible = false;
}

// Update smoke effect
if (time < 2.0) {
    const barrelEndPosition = new THREE.Vector3();
    barrelTip.getWorldPosition(barrelEndPosition);
    smokeEffect.position.copy(barrelEndPosition);
    
    // Animate smoke particles
    const smokeParticles = smokeEffect.children;
    for (let i = 0; i < smokeParticles.length; i++) {
        const particle = smokeParticles[i];
        particle.position.x += particle.userData.velocity.x * deltaTime;
        particle.position.y += particle.userData.velocity.y * deltaTime;
        particle.position.z += particle.userData.velocity.z * deltaTime;
        
        // Expand smoke over time
        particle.scale.addScalar(deltaTime * 0.5);
        
        // Fade out smoke
        if (particle.material.opacity > 0) {
            particle.material.opacity -= deltaTime * 0.5;
        }
    }
} else {
    // Remove smoke after 2 seconds
    scene.remove(smokeEffect);
}

// Update dust effect
if (artillery.dustEffect && artillery.dustEffect.visible) {
    const dustParticles = artillery.dustEffect.children;
    let allDustExpired = true;
    
    for (let i = 0; i < dustParticles.length; i++) {
        const dust = dustParticles[i];
        dust.userData.age += deltaTime;
        
        if (dust.userData.age < dust.userData.lifetime) {
            allDustExpired = false;
            
            // Move dust according to velocity
            dust.position.x += dust.userData.velocity.x * deltaTime;
            dust.position.y += dust.userData.velocity.y * deltaTime;
            dust.position.z += dust.userData.velocity.z * deltaTime;
            
            // Slow down over time (drag)
            dust.userData.velocity.multiplyScalar(0.95);
            
            // Add some gravity
            dust.userData.velocity.y -= deltaTime * 1.5;
            
            // Expand dust
            dust.scale.addScalar(deltaTime * 0.3);
            
            // Fade out
            const fadeRatio = dust.userData.age / dust.userData.lifetime;
            dust.material.opacity = 0.7 * (1 - fadeRatio);
        } else {
            // Hide expired dust particles
            dust.material.opacity = 0;
        }
    }
    
    if (allDustExpired) {
        artillery.dustEffect.visible = false;
    }
}

// Collision detection
if (targetMesh && checkCollision(shell, targetMesh)) {
    cleanup(shell.position);
    return;
}

// Ground collision
if (shell.position.y <= 0) {
    cleanup(new THREE.Vector3(shell.position.x, 0, shell.position.z));
    return;
}

if (shakeTime < shakeDuration) {
    shakeTime += deltaTime;
    const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * 2 * shakeIntensity,
        (Math.random() - 0.5) * 2 * shakeIntensity,
        (Math.random() - 0.5) * 2 * shakeIntensity
    );
    camera.position.copy(originalCameraPosition).add(shakeOffset);
}

if (time > shakeDuration) {
    controls.target.copy(shell.position);
    controls.update();
}

if (shell.position.y <= 0) {
    const impactPosition = new THREE.Vector3(
        shell.position.x,
        0,
        shell.position.z
    );
    
    createExplosion(impactPosition);
    scene.remove(shell);
    
    setTimeout(() => {
        
        controls.target.copy(originalCameraTarget);
        camera.position.copy(originalCameraPosition);
        controls.update();
        
        // The explosion collision detection in createExplosion will handle hits
        // This is just for misses
        const targetPosition = new THREE.Vector3(
            gameState.positions.target.x,
            0,
            gameState.positions.target.z
        );
        const distanceToTarget = impactPosition.distanceTo(targetPosition);
        
        // If not already handled as a hit by the explosion
        if (distanceToTarget >= 15) { // Explosion radius
            handleMiss(distanceToTarget);
        }
        
        gameState.isFiring = false;
    }, 2000);
    return;
}

if (gameState.isFiring) {
    animationFrameId = requestAnimationFrame(animate);
}
};

animate();
}

// Function to eject shell casing
function ejectShellCasing() {
if (!artillery.shellCasingTemplate || !artillery.ejectionPort) return;

// Clone the shell casing template
const casing = artillery.shellCasingTemplate.clone();
casing.visible = true;

// Get the world position of the ejection port
const ejectionPosition = new THREE.Vector3();
artillery.ejectionPort.getWorldPosition(ejectionPosition);

casing.position.copy(ejectionPosition);

// Add random rotation and velocity
casing.userData = {
velocity: new THREE.Vector3(
    (Math.random() - 0.5) * 3,
    Math.random() * 5 + 2,
    (Math.random() - 0.5) * 3
),
rotationVelocity: new THREE.Vector3(
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5
),
lifetime: 0,
maxLifetime: 3 // seconds
};

scene.add(casing);

// Animate the casing
function animateCasing() {
const deltaTime = Math.min(0.05, clock.getDelta());

casing.userData.lifetime += deltaTime;

// Apply gravity
casing.userData.velocity.y -= 9.8 * deltaTime;

// Update position
casing.position.x += casing.userData.velocity.x * deltaTime;
casing.position.y += casing.userData.velocity.y * deltaTime;
casing.position.z += casing.userData.velocity.z * deltaTime;

// Update rotation
casing.rotation.x += casing.userData.rotationVelocity.x * deltaTime;
casing.rotation.y += casing.userData.rotationVelocity.y * deltaTime;
casing.rotation.z += casing.userData.rotationVelocity.z * deltaTime;

// Check for ground collision
if (casing.position.y <= 0.3) {
    casing.position.y = 0.3;
    
    // Bounce with energy loss
    casing.userData.velocity.y = -casing.userData.velocity.y * 0.3;
    
    // Apply friction to horizontal velocity
    casing.userData.velocity.x *= 0.7;
    casing.userData.velocity.z *= 0.7;
    
    // Reduce rotation
    casing.userData.rotationVelocity.multiplyScalar(0.7);
}

// Remove after lifetime expires
if (casing.userData.lifetime >= casing.userData.maxLifetime) {
    scene.remove(casing);
    return;
}

requestAnimationFrame(animateCasing);
}

animateCasing();
}
function safeHandleHit() {
    if (gameState.hitRegistered) return;
    gameState.hitRegistered = true;
    handleHit();
  }
// Function to modify the createArtillery function to include firing effects
function modifyCreateArtillery() {
// This function should be called after the original createArtillery
// to add the necessary components for firing effects

// Create the fire effect
const fireEffect = createFireEffect();
artillery.fireEffect = fireEffect;

// Add ejection port for shell casings
const ejectionPortGroup = new THREE.Group();
ejectionPortGroup.position.set(0, 0, -2); // Position at the rear of the barrel

const portGeometry = new THREE.BoxGeometry(1, 1, 0.5);
const portMaterial = new THREE.MeshStandardMaterial({
color: 0x222222,
roughness: 0.3,
metalness: 0.8
});

const ejectionPort = new THREE.Mesh(portGeometry, portMaterial);
ejectionPortGroup.add(ejectionPort);

// Add to the barrel group
artilleryBarrel.add(ejectionPortGroup);

// Create shell casing template (will be cloned when firing)
const casingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12);
const casingMaterial = new THREE.MeshStandardMaterial({
color: 0xb5a642, // Brass color
roughness: 0.3,
metalness: 0.8
});

const shellCasingTemplate = new THREE.Mesh(casingGeometry, casingMaterial);
shellCasingTemplate.visible = false;
scene.add(shellCasingTemplate);

// Store reference for later use
artillery.shellCasingTemplate = shellCasingTemplate;
artillery.ejectionPort = ejectionPortGroup;

// Create dust effect for when firing
const dustGroup = new THREE.Group();
dustGroup.visible = false;

for (let i = 0; i < 30; i++) {
const dustGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8);
const dustMaterial = new THREE.MeshBasicMaterial({
    color: 0xccccaa,
    transparent: true,
    opacity: 0.4 + Math.random() * 0.3
});

const dust = new THREE.Mesh(dustGeometry, dustMaterial);

// Random position around the artillery
const angle = Math.random() * Math.PI * 2;
const radius = 3 + Math.random() * 3;
dust.position.set(
    Math.cos(angle) * radius,
    0.1 + Math.random() * 0.5,
    Math.sin(angle) * radius
);

// Store velocity for animation
dust.userData.velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    Math.random() * 1.5,
    (Math.random() - 0.5) * 2
);

// Store lifetime
dust.userData.lifetime = 1 + Math.random() * 1.5;
dust.userData.age = 0;

dustGroup.add(dust);
}

artillery.dustEffect = dustGroup;
scene.add(dustGroup);
}

// Create fire effect function (called from createArtillery)
function createFireEffect() {
const fireGroup = new THREE.Group();

// Position at the barrel tip
const barrelTipWorldPos = new THREE.Vector3();
barrelTip.getWorldPosition(barrelTipWorldPos);
fireGroup.position.copy(barrelTipWorldPos);

// Create particle system for fire
const fireGeometry = new THREE.BufferGeometry();
const fireCount = 100;
const firePositions = new Float32Array(fireCount * 3);
const fireSizes = new Float32Array(fireCount);

for (let i = 0; i < fireCount; i++) {
const i3 = i * 3;
firePositions[i3] = 0;
firePositions[i3 + 1] = 0;
firePositions[i3 + 2] = 0;
fireSizes[i] = Math.random() * 2 + 1;
}

fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
fireGeometry.setAttribute('size', new THREE.BufferAttribute(fireSizes, 1));

// Create a simple material for the fire effect
const fireMaterial = new THREE.PointsMaterial({
size: 2,
color: 0xff5500,
transparent: true,
opacity: 0.8,
depthWrite: false
});

const fire = new THREE.Points(fireGeometry, fireMaterial);
fire.visible = false; // Only visible when firing
fireGroup.add(fire);

return fireGroup;
}


function checkCollision(mesh1, mesh2) {
// Update the bounding boxes/spheres
mesh1.geometry.computeBoundingSphere();
mesh2.geometry.computeBoundingSphere();

// Get the bounding spheres
const sphere1 = mesh1.geometry.boundingSphere.clone();
const sphere2 = mesh2.geometry.boundingSphere.clone();

// Apply the mesh transformations to the bounding spheres
sphere1.radius *= Math.max(
mesh1.scale.x, 
mesh1.scale.y, 
mesh1.scale.z
);
sphere2.radius *= Math.max(
mesh2.scale.x, 
mesh2.scale.y, 
mesh2.scale.z
);

// Get world positions
const position1 = new THREE.Vector3();
const position2 = new THREE.Vector3();
mesh1.getWorldPosition(position1);
mesh2.getWorldPosition(position2);

// Calculate distance between centers
const distance = position1.distanceTo(position2);

// Check if the spheres intersect
return distance < (sphere1.radius + sphere2.radius);
}
function createExplosion(position) {
const explosionRadius = 15;
const particleCount = 500;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
particlePositions[i * 3] = position.x;
particlePositions[i * 3 + 1] = position.y;
particlePositions[i * 3 + 2] = position.z;
}
particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMaterial = new THREE.PointsMaterial({
color: 0xff9933,
size: 2,
blending: THREE.AdditiveBlending,
transparent: true,
sizeAttenuation: true
});
const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);
const velocities = [];
for (let i = 0; i < particleCount; i++) {
velocities.push({
    x: (Math.random() - 0.5) * 20,
    y: Math.random() * 20,
    z: (Math.random() - 0.5) * 20
});
}
if (targetMesh) {
const targetPosition = new THREE.Vector3();
targetMesh.getWorldPosition(targetPosition);
const distanceToTarget = position.distanceTo(targetPosition);

// If the explosion radius reaches the target
if (distanceToTarget < explosionRadius + targetMesh.geometry.boundingSphere.radius) {
    setTimeout(() => {
        safeHandleHit();;
    }, 500);}}
let explosionTime = 0;
const explosionDuration = 2; 
const animateExplosion = () => {
const deltaTime = Math.min(0.05, clock.getDelta());
explosionTime += deltaTime;
const positions = particleGeometry.attributes.position.array;
for (let i = 0; i < particleCount; i++) {
    positions[i * 3] += velocities[i].x * deltaTime;
    positions[i * 3 + 1] += velocities[i].y * deltaTime;
    positions[i * 3 + 2] += velocities[i].z * deltaTime;
    velocities[i].y -= 9.8 * deltaTime;
}
particleGeometry.attributes.position.needsUpdate = true;
particleMaterial.opacity = 1 - (explosionTime / explosionDuration);
if (explosionTime < explosionDuration) {
    requestAnimationFrame(animateExplosion);
} else {
    scene.remove(particles);
}
};
animateExplosion();
}
function handleHit() {
addMessage(`Forward Observer: Direct hit! Target destroyed!`);
scene.remove(targetMesh);
const accuracyBonus = 100;
const difficultyMultiplier = difficultySettings[gameState.difficulty].scoreMultiplier;
const timeBonus = Math.floor(gameState.timeRemaining / 10);
const shellBonus = gameState.shells * 50;
const score = (accuracyBonus + timeBonus + shellBonus) * difficultyMultiplier;
gameState.score += score;
gameState.wins++;
endGame(true, `Target destroyed! Score: ${score}`);
}
function handleMiss(distance) {
addMessage(`Forward Observer: Miss! Shell landed ${distance.toFixed(1)} ft from target.`);
const targetVector = new THREE.Vector3().subVectors(
gameState.positions.target,
gameState.positions.battery
);
const targetAzimuth = (Math.atan2(targetVector.x, targetVector.z) * 180 / Math.PI + 360) % 360;
const azimuthDiff = ((targetAzimuth - gameState.currentAzimuth + 180) % 360) - 180;
let azimuthFeedback = "";
if (Math.abs(azimuthDiff) > 5) {
azimuthFeedback = azimuthDiff > 0 ? "Adjust azimuth right." : "Adjust azimuth left.";
}
const elevationDiff = gameState.solution.elevation - gameState.currentElevation;
let elevationFeedback = "";
if (Math.abs(elevationDiff) > 0.5) {
elevationFeedback = elevationDiff > 0 ? "Increase elevation." : "Decrease elevation.";
}
if (azimuthFeedback || elevationFeedback) {
addMessage(`Forward Observer: ${azimuthFeedback} ${elevationFeedback}`);
}
if (gameState.shells <= 0) {
endGame(false, "Out of shells");
}
}
function startTimer() {
gameState.timerInterval = setInterval(() => {
gameState.timeRemaining--;
updateTimerDisplay();
if (gameState.timeRemaining <= 0) {
    clearInterval(gameState.timerInterval);
    endGame(false, "Time's up");
}
}, 1000);
}
function updateTimerDisplay() {
const minutes = Math.floor(gameState.timeRemaining / 60);
const seconds = gameState.timeRemaining % 60;
timerDisplay.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
if (gameState.timeRemaining <= 60) {
timerDisplay.style.color = '#ff3333';
}
}
function updateShellCounter() {
shellCounter.textContent = `Shells: ${gameState.shells}`;
}
function addMessage(message) {
const messageElement = document.createElement('div');
messageElement.className = 'message';
messageElement.textContent = message;
messageLog.appendChild(messageElement);
messageLog.scrollTop = messageLog.scrollHeight;
}
function showDebugInfo() {
addMessage(`DEBUG MODE ACTIVATED`);
addMessage(`Solution: Elevation ${gameState.solution.elevation.toFixed(2)}°, Azimuth ${gameState.solution.azimuth.toFixed(2)}°`);
addMessage(`FO to Target distance: ${gameState.distances.foToTarget.toFixed(2)} ft`);
}
function endGame(success, reason) {
if (gameState.timerInterval) {
clearInterval(gameState.timerInterval);
}
gameOver.style.display = 'flex';
if (success) {
gameOverTitle.textContent = 'MISSION ACCOMPLISHED';
gameOverTitle.style.color = '#33ff33';
const rank = getMilitaryRank(gameState.score);
gameOverStats.innerHTML = `
    <p>Target destroyed!</p>
    <p>Score: ${gameState.score}</p>
    <p>Rank: ${rank}</p>
    <p>Successful missions: ${gameState.wins}</p>
`;
} else {
gameOverTitle.textContent = 'MISSION FAILED';
gameOverTitle.style.color = '#ff3333';
gameOverStats.innerHTML = `
<p>Position compromised!</p>
    <p>${reason}</p>
    <p>Score: ${gameState.score}</p>
    <p>Successful missions: ${gameState.wins}</p>
`;
createAirplaneBombing();
}

}
function getMilitaryRank(score) {
let rank = militaryRanks[0].rank;
for (let i = 0; i < militaryRanks.length; i++) {
if (score >= militaryRanks[i].score) {
    rank = militaryRanks[i].rank;
} else {
    break;
}
}
return rank;
}
function resetGame() {
gameOver.style.display = 'none';
hud.style.display = 'none';
controlsPanel.style.display = 'none';  
messageLog.style.display = 'none';
shellCounter.style.display = 'none';
timerDisplay.style.display = 'none';
commanderChart.style.display = 'none';
homeScreen.style.display = 'flex';
messageLog.innerHTML = '';
gameState.started = false;
gameState.isFiring = false;
if (targetMesh) scene.remove(targetMesh);
if (foMesh) scene.remove(foMesh);
if (shell) scene.remove(shell);
if (shellTrajectory) scene.remove(shellTrajectory);
camera.position.set(50, 30, 50);
camera.lookAt(0, 0, 0);
controls.target.set(0, 0, 0);
controls.update();
updateArtilleryElevation(0);
updateArtilleryAzimuth(0);
elevationInput.value = 0;
elevationSlider.value = 0;
azimuthInput.value = 0;
azimuthSlider.value = 0;
}

function createSmokeParticle(position) {
const smokeMaterial = new THREE.SpriteMaterial({
map: smokeTexture,
transparent: true,
opacity: 0, // Start fully transparent
depthWrite: false,
blending: THREE.AdditiveBlending // This enhances the glowing effect; adjust if needed
});
const smokeSprite = new THREE.Sprite(smokeMaterial);
// Establish an initial scale. Adjust these values depending on your scene.
smokeSprite.scale.set(1, 1, 1);
smokeSprite.position.copy(position);
// Record the exact creation time.
smokeSprite.userData.startTime = performance.now();
scene.add(smokeSprite);
smokeParticles.push(smokeSprite);
}

// Update each smoke particle's opacity and scale based on its age.
function updateSmokeTrail() {
const now = performance.now();
const lifetime = 5000;     // Total lifetime in milliseconds (2 seconds)
const delay = 200;         // Delay in milliseconds (0.2 seconds) before the smoke appears
const fadeInTime = 500;   // Time (in ms) by which the smoke reaches its max opacity
const maxAlpha = 0.9;      // Desired maximum opacity

// Iterate backwards to safely remove particles that have expired.
for (let i = smokeParticles.length - 1; i >= 0; i--) {
const particle = smokeParticles[i];
const age = now - particle.userData.startTime;

if (age > lifetime) {
// Remove the particle after its lifetime ends.
scene.remove(particle);
smokeParticles.splice(i, 1);
} else {
let opacity = 0;
if (age < delay) {
// Initial delay period: keep it invisible.
opacity = 0;
} else if (age < fadeInTime) {
// Fade in from 0.2s to 1s.
opacity = ((age - delay) / (fadeInTime - delay)) * maxAlpha;
} else {
// Fade out linearly from 1s to 2s.
opacity = (1 - ((age - fadeInTime) / (lifetime - fadeInTime))) * maxAlpha;
}
particle.material.opacity = opacity;

// Optional: gradually increase the scale to simulate the smoke expanding and dissipating.
const scaleFactor = 1 + 15 * (age / lifetime); // Adjust multiplier (0.5) as desired.
particle.scale.set(scaleFactor, scaleFactor, scaleFactor);
}
}
}

function animate() {
requestAnimationFrame(animate);
controls.update();
renderer.render(scene, camera);
if (shell) {
// Continuously add a smoke particle at the shell's current position.
// You might throttle how many particles you add if needed.
createSmokeParticle(shell.position);
}

// Update particles so they fade and get removed after 1 second.
updateSmokeTrail();
}

document.addEventListener('DOMContentLoaded', (event) => {
    // Get the pre element by its ID
    const chartFormulasElement = document.getElementById('chart-formulas');

    if (chartFormulasElement) {
        // Get the original text content
        let content = chartFormulasElement.textContent;

        // Replace the placeholder with the actual value
        content = content.replace('${gameState.batteryName}', batteryNameInput.value);

        // Update the element's content
        chartFormulasElement.textContent = content;
    }
});
function createBulletElements() {
    const types = ['FMJ', 'API', 'ETR'];
    types.forEach(type => {
        const b = document.createElement('div');
        b.className = 'bullet ' + type;
        b.draggable = true;
        b.textContent = type;
        b.dataset.type = type; // Store type for drag/drop

        // Create scratch mark (can be done with CSS :before or :after too)
        const scratch = document.createElement('div');
        scratch.className = 'scratch';
        b.appendChild(scratch);

        bulletRack.appendChild(b);
    });
}
function createAirplaneBombing() {
    // Create airplane
    const airplaneGroup = new THREE.Group();
    
    // Airplane body
    const bodyGeometry = new THREE.CylinderGeometry(2, 2, 20, 8);
    bodyGeometry.rotateZ(Math.PI / 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    airplaneGroup.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(15, 1, 5);
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    airplaneGroup.add(wing);
    
    // Tail
    const tailGeometry = new THREE.BoxGeometry(5, 3, 1);
    tailGeometry.translate(-8, 2, 0);
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    airplaneGroup.add(tail);
    
    // Position airplane
    airplaneGroup.position.set(-500, 100, -500);
    scene.add(airplaneGroup);
    
    // Animate airplane
    const animateAirplane = function() {
        airplaneGroup.position.x += 5;
        airplaneGroup.position.z += 5;
        
        // Drop bomb when near battery
        if (airplaneGroup.position.x > -50 && !airplaneGroup.userData.bombDropped) {
            airplaneGroup.userData.bombDropped = true;
            dropBomb(airplaneGroup.position.x, airplaneGroup.position.z);
        }
        
        // Remove airplane when it goes off screen
        if (airplaneGroup.position.x > 500) {
            scene.remove(airplaneGroup);
            return;
        }
        
        requestAnimationFrame(animateAirplane);
    };
    
    airplaneGroup.userData = { bombDropped: false };
    animateAirplane();
    }
    
    // Drop bomb from airplane
    function dropBomb(x, z) {
    const bombGeometry = new THREE.SphereGeometry(2, 16, 16);
    const bombMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const bomb = new THREE.Mesh(bombGeometry, bombMaterial);
    bomb.position.set(x, 100, z);
    scene.add(bomb);
    
    // Animate bomb falling
    const animateBomb = function() {
        bomb.position.y -= 2;
        
        // Bomb hits ground
        if (bomb.position.y <= 0) {
            scene.remove(bomb);
            createExplosion2(0, 0, 0, 0xff0000);
            return;
        }
        
        requestAnimationFrame(animateBomb);
    };
    
    animateBomb();
    }
    function createExplosion2(x, y, z, color) {
        const explosionGeometry = new THREE.SphereGeometry(10, 16, 16);
        const explosionMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        
        const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
        explosion.position.set(x, y, z);
        scene.add(explosion);
        
        // Animate explosion
        let scale = 1;
        const expandExplosion = function() {
            scale += 0.2;
            explosion.scale.set(scale, scale, scale);
            explosion.material.opacity -= 0.05;
            
            if (explosion.material.opacity <= 0) {
                scene.remove(explosion);
                return;
            }
            
            requestAnimationFrame(expandExplosion);
        };
        
        expandExplosion();
        }
        
init();
