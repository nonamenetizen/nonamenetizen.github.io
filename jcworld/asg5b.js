import * as THREE from 'https://cdn.skypack.dev/three@0.132.2';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.132.2/examples/jsm/postprocessing/ShaderPass.js';
import { CharacterControls } from './characterControls.js'; // call this 
import { grassFragmentShader } from './grassShader.js'; // Import the shader
// import { fogShader } from './fogShader.js';

const grassVertexShader = `
    attribute float bladeHeight;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        vec3 newPosition = position;
        newPosition.y *= bladeHeight; // Scale the blade height
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`;

// Define uniforms
const grassUniforms = {
    iTime: { value: 0.0 },
    iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
};

// Create the shader material
const grassMaterial = new THREE.ShaderMaterial({
    uniforms: grassUniforms,
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    side: THREE.DoubleSide
});
//the grass part

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Set shadow map type for soft shadows
document.body.appendChild(renderer.domElement);

// Setup scene
const scene = new THREE.Scene();

// Setup camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Set background color to match fog color
const fogColor = 0xcccccc;
scene.background = new THREE.Color(fogColor);

// Ground plane
const planeGeometry = new THREE.PlaneGeometry(100, 100);
 const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
 const plane = new THREE.Mesh(planeGeometry, planeMaterial);
//const plane = new THREE.Mesh(planeGeometry, grassMaterial); // Apply shader material

plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
plane.position.y = 0; //why was this -5??? should be 0
scene.add(plane);




//loaded the dude to move around. 
//need the controls instantiated
let characterControls;
let characterBoundingBox;
let previousPosition = new THREE.Vector3();

const gltfLoader = new GLTFLoader();
// gltfLoader.load('Soldier.glb', function (gltf) {
gltfLoader.load('jcver1.glb', function (gltf) {
    const model = gltf.scene;
    model.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
    });
    scene.add(model);
    
    const gltfAnimations = gltf.animations;
    if (gltfAnimations && gltfAnimations.length) {
        const mixer = new THREE.AnimationMixer(model);
        const animationsMap = new Map();
        // gltfAnimations.filter(a => a.name !== 'TPose').forEach((a) => {
        //     animationsMap.set(a.name, mixer.clipAction(a));
        // });
        
        gltfAnimations.filter(a => a.name !== 'tpose').forEach((a) => {
            animationsMap.set(a.name, mixer.clipAction(a));
        });
        
        characterControls = new CharacterControls(model, mixer, animationsMap, controls, camera, 'Idle');
    }//ok???

    // Create character bounding box
    characterBoundingBox = new THREE.Box3().setFromObject(model);
});

// const gltfLoader2 = new GLTFLoader();
// gltfLoader2.load('struggle.glb', function (gltf) {
//     const model2 = gltf.scene;
//     model2.traverse(function (object) {
//         if (object.isMesh) object.castShadow = true;
//     });
    
//     model2.scale.set(100, 100, 100); // Example scale adjustment
//     model2.position.set(0, 10, 0); // Example position adjustment
//     scene.add(model2);


//     });

const keysPressed = {};

document.addEventListener('keydown', (event) => {
    if (event.shiftKey && characterControls) { //sorry for not listening
        characterControls.switchRunToggle();
    } else {
        keysPressed[event.key.toLowerCase()] = true;
    }
}, false);

document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
}, false);

// Load texture
const textureLoader2 = new THREE.TextureLoader();
const texture = textureLoader2.load('./texture.jpg');

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.radius = 4;
scene.add(directionalLight);

// Modify orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;  // Enable damping (inertia)
controls.dampingFactor = 0.25;  // Damping factor
controls.minDistance = 5;  // Minimum distance for zooming in
controls.maxDistance = 15;  // Maximum distance for zooming out
controls.enablePan = false;  // Disable panning
controls.maxPolarAngle = Math.PI / 2 - 0.05;  // Maximum polar angle
controls.update();  // Update controls

// Function to create a tree
function createTree(positionX, positionZ) {
    const trunkGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 32);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(positionX, 2, positionZ); //adjust pos lmfao underground trees
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    const foliageGeometry = new THREE.ConeGeometry(2, 4, 32);
    const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(positionX, 4, positionZ);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(foliage);
    scene.add(tree);

    // Create tree bounding box
    const treeBoundingBox = new THREE.Box3().setFromObject(tree);
    // treeBoundingBoxes.push(treeBoundingBox);
    
    const treeBoundingBoxScaled = new THREE.Box3(
        treeBoundingBox.min.clone().lerp(treeBoundingBox.max, 0.2),
        treeBoundingBox.max.clone().lerp(treeBoundingBox.min, 0.2)
    );

    treeBoundingBoxes.push(treeBoundingBoxScaled); //try scaling the hit box down so he can go between them 
}

// Array to store tree bounding boxes
const treeBoundingBoxes = [];

// Add multiple trees to the scene
const treeCount = 50;
for (let i = 0; i < treeCount; i++) {
    const positionX = (Math.random() - 0.5) * 100;
    const positionZ = (Math.random() - 0.5) * 100;
    createTree(positionX, positionZ);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);  // Update composer size as well
});

scene.fog = new THREE.FogExp2(fogColor, 0.04);

// Custom fog shader
const fogShader = {
    uniforms: {
        tDiffuse: { value: null },
        u_FogColor: { value: new THREE.Color(fogColor) },
        u_Near: { value: 1.0 },
        u_Far: { value: 100.0 },
        u_FogDensity: { value: 0.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying float vDepth;
        void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vDepth = -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec3 u_FogColor;
        uniform float u_Near;
        uniform float u_Far;
        uniform float u_FogDensity;
        varying vec2 vUv;
        varying float vDepth;

        float linearizeDepth(float depth) {
            return (2.0 * u_Near * u_Far) / (u_Far + u_Near - (depth * 2.0 - 1.0) * (u_Far - u_Near));
        }

        void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            float depth = linearizeDepth(gl_FragCoord.z / gl_FragCoord.w);
            float fogFactor = exp(-u_FogDensity * depth * depth);
            fogFactor = clamp(fogFactor, 0.0, 1.0);
            vec3 fogColor = mix(u_FogColor, texel.rgb, fogFactor);
            gl_FragColor = vec4(fogColor, texel.a);
        }
    `
};

const fogPass = new ShaderPass(fogShader);
fogPass.uniforms.tDiffuse.value = new THREE.Texture();

fogPass.renderToScreen = true;

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
composer.addPass(fogPass);

function checkCollision() {
    // Update character bounding box
    characterBoundingBox.setFromObject(characterControls.model);
    
    //we gotta make this shit smaller too until something goes wrong
    const characterBoundingBoxScaled = new THREE.Box3(
        characterBoundingBox.min.clone().lerp(characterBoundingBox.max, 0.1),
        characterBoundingBox.max.clone().lerp(characterBoundingBox.min, 0.1)
    );

    // Check for intersection with tree bounding boxes
    for (let i = 0; i < treeBoundingBoxes.length; i++) {
        //if (characterBoundingBox.intersectsBox(treeBoundingBoxes[i])) {
         if (characterBoundingBoxScaled.intersectsBox(treeBoundingBoxes[i])) {
            return treeBoundingBoxes[i];
        }
    }
    return null;
}

// Adjust position to slide along the edges of the tree bounding box
function resolveCollision(collisionBox) {
    const characterMin = characterBoundingBox.min;
    const characterMax = characterBoundingBox.max;
    const treeMin = collisionBox.min;
    const treeMax = collisionBox.max;

    const dx = Math.min(characterMax.x - treeMin.x, treeMax.x - characterMin.x);
    const dz = Math.min(characterMax.z - treeMin.z, treeMax.z - characterMin.z);

    if (dx < dz) {
        if (characterBoundingBox.getCenter(new THREE.Vector3()).x < treeMax.x) {
            characterControls.model.position.x -= dx;
        } else {
            characterControls.model.position.x += dx;
        }
    } else {
        if (characterBoundingBox.getCenter(new THREE.Vector3()).z < treeMax.z) {
            characterControls.model.position.z -= dz;
        } else {
            characterControls.model.position.z += dz;
        }
    }
}

// Animate

const clock = new THREE.Clock();
function animate() {
  let mixerUpdateDelta = clock.getDelta();
  
  if (characterControls) {
    // Save the previous position before updating
    previousPosition.copy(characterControls.model.position);
    
    characterControls.update(mixerUpdateDelta, keysPressed);

    const collisionBox = checkCollision();
    if (collisionBox) {
        resolveCollision(collisionBox);
    }
  }
  grassUniforms.iTime.value += mixerUpdateDelta;

  requestAnimationFrame(animate);
  controls.update();
  composer.render();  // Apply post-processing
}


// let fogDensity = 0.5;
// const maxFogDensity = 1.0;
// const minFogDensity = 0.0;
// const fogDensitySpeed = 0.01;

// function animateFog() {
//     // Update fog density
//     fogDensity += fogDensitySpeed;

    
//     if (fogDensity > maxFogDensity) {
//         fogDensity = maxFogDensity;
//         fogDensitySpeed *= -1; 
//     } else if (fogDensity < minFogDensity) {
//         fogDensity = minFogDensity;
//         fogDensitySpeed *= -1; 
//     }

//     // Update fog shader uniform
//     fogPass.uniforms.u_FogDensity.value = fogDensity;

//     requestAnimationFrame(animateFog);
// }

// animateFog();
// //goes up but never goes down?

let fogDensity = 0.5;
const maxFogDensity = 1.0;
const minFogDensity = 0.5;
const fogDensitySpeed = 0.005;

let increasing = true;

// Function to animate fog density
function animateFog() {
    if (increasing) {
        fogDensity += fogDensitySpeed;
        if (fogDensity >= maxFogDensity) {
            fogDensity = maxFogDensity;
            increasing = false;
        }
    } else {
        fogDensity -= fogDensitySpeed;
        if (fogDensity <= minFogDensity) {
            fogDensity = minFogDensity;
            increasing = true;
        }
    }

    fogPass.uniforms.u_FogDensity.value = fogDensity;
    requestAnimationFrame(animateFog);
}

animateFog();
//ok ok ok ok this works



animate();

//things to do: scale down bounding boxes so my guy can go between trees
//yeah idk how to get rid of the spasming when it does collide with a tree bounding box. sucks to suck ig will enter contest to ask?

//idk why the custom fog shader looks like that. will figure out later.