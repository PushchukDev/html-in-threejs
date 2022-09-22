import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { gsap } from 'gsap';

/**
 * Loaders
 */
let sceneReady = false;
const loadingBarElement = document.querySelector('.loading-bar');
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () => {
    // Wait a little
    window.setTimeout(() => {
      // Animate overlay
      gsap.to(overlayMaterial.uniforms.uAlpha, {
        duration: 3,
        value: 0,
        delay: 1,
      });

      // Update loadingBarElement
      loadingBarElement.classList.add('ended');
      loadingBarElement.style.transform = '';
    }, 500);

    window.setTimeout(() => {
      sceneReady = true;
    }, 2000);
  },

  // Progress
  (itemUrl, itemsLoaded, itemsTotal) => {
    // Calculate the progress and update the loadingBarElement
    const progressRatio = itemsLoaded / itemsTotal;
    loadingBarElement.style.transform = `scaleX(${progressRatio})`;
  }
);
const gltfLoader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

/**
 * Base
 */
// Debug
const debugObject = {};

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  // wireframe: true,
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 },
  },
  vertexShader: `
         void main()
         {
             gl_Position = vec4(position, 1.0);
         }
     `,
  fragmentShader: `
         uniform float uAlpha;
 
         void main()
         {
             gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
         }
     `,
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

/**
 * Update all materials
 */
const updateAllMaterials = () => {
  scene.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      child.material instanceof THREE.MeshStandardMaterial
    ) {
      // child.material.envMap = environmentMap
      child.material.envMapIntensity = debugObject.envMapIntensity;
      child.material.needsUpdate = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
  './textures/environmentMaps/4/px.png',
  './textures/environmentMaps/4/nx.png',
  './textures/environmentMaps/4/py.png',
  './textures/environmentMaps/4/ny.png',
  './textures/environmentMaps/4/pz.png',
  './textures/environmentMaps/4/nz.png',
]);

environmentMap.encoding = THREE.sRGBEncoding;

scene.background = environmentMap;
scene.environment = environmentMap;

debugObject.envMapIntensity = 2.5;

/**
 * Models
 */
gltfLoader.load('./models/car/scene.gltf', (gltf) => {
  gltf.scene.scale.set(2, 2, 2);
  gltf.scene.rotation.y = Math.PI * 0.85;
  scene.add(gltf.scene);
  updateAllMaterials();
});

//Plane
const concreteTexture = textureLoader.load(
  './textures/floor/Portuguese_Floor_001_COLOR.jpg'
);
const concreteNormal = textureLoader.load(
  './textures/floor/Portuguese_Floor_001_NORM.jpg'
);
const planeGeom = new THREE.CircleGeometry(13, 64);
const planeMat = new THREE.MeshStandardMaterial({
  side: THREE.DoubleSide,
});
//Color Texture
planeMat.map = concreteTexture;
planeMat.map.repeat.set(1.5, 1.5);
planeMat.map.wrapS = THREE.RepeatWrapping;
planeMat.map.wrapT = THREE.RepeatWrapping;
//Normal Map
planeMat.normalMap = concreteNormal;
planeMat.normalMap.repeat.set(1.5, 1.5);
planeMat.normalMap.wrapS = THREE.RepeatWrapping;
planeMat.normalMap.wrapT = THREE.RepeatWrapping;
//mesh
const planeA = new THREE.Mesh(planeGeom, planeMat);
planeA.rotation.x = -Math.PI * 0.5;
planeA.position.y = -0.046;
planeA.receiveShadow = true;
scene.add(planeA);

/**
 * Points of interest
 */
const raycaster = new THREE.Raycaster();
const points = [
  {
    position: new THREE.Vector3(0.75, 5.2, -2.1),
    element: document.querySelector('.point-0'),
  },
  {
    position: new THREE.Vector3(-3.3, 3.2, -2.1),
    element: document.querySelector('.point-1'),
  },
  {
    position: new THREE.Vector3(3.3, 3.2, 2.1),
    element: document.querySelector('.point-2'),
  },
  {
    position: new THREE.Vector3(0.1, 3.2, 8.7),
    element: document.querySelector('.point-3'),
  },
  {
    position: new THREE.Vector3(4.0, 3.6, -8.0),
    element: document.querySelector('.point-4'),
  },
  {
    position: new THREE.Vector3(-4.0, 4.4, 7.5),
    element: document.querySelector('.point-5'),
  },
];

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.normalBias = 0.05;
directionalLight.position.set(0.25, 3, -2.25);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(5, 5, -30);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
// controls.minPolarAngle = Math.PI / 2;
// controls.maxPolarAngle = Math.PI / 2;
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 3;
renderer.setClearColor('#888888');
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update();

  if (sceneReady) {
    // Go through each point
    for (const point of points) {
      const screenPosition = point.position.clone();
      screenPosition.project(camera);

      raycaster.setFromCamera(screenPosition, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length === 0) {
        point.element.classList.add('visible');
      } else {
        const intersectionDistance = intersects[0].distance;
        const pointDistance = point.position.distanceTo(camera.position);

        if (intersectionDistance < pointDistance) {
          point.element.classList.remove('visible');
        } else {
          point.element.classList.add('visible');
        }
      }

      const translateX = screenPosition.x * sizes.width * 0.5;
      const translateY = -screenPosition.y * sizes.height * 0.5;
      point.element.style.transform = `translate(${translateX}px,${translateY}px)`;
      // console.log(translateX);
    }
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
