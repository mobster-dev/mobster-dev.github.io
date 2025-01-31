import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';

let cameraPersp, cameraOrtho, currentCamera;
let scene, renderer;
let modelScene;
let initial = true;

const screenDiv = document.getElementById('screen');
const buttonsContainer = document.getElementById('buttons-container');
const myWork = document.getElementById('my-work');
const about = document.getElementById('about');
const contact = document.getElementById('Contact');
const iframeContainer = document.getElementById('iframe-container');
const iframe = document.getElementById('iframe');
const buttonAbout = document.getElementById('button-about');
const splashScreen = document.getElementById('splash-screen')

const sound = document.getElementById('sound')

const backgroundSound = document.getElementById('background-sound')
const select = document.getElementById('select')
backgroundSound.volume = 0.1
select.volume = 0.1


let sky_config_gui;
let sky, sun, stars 
const sunLight = new THREE.DirectionalLight(0xffffff, 4);
const ambientLight = new THREE.AmbientLight(0xffffff);

const clock = new THREE.Clock();

const viewerDiv = document.getElementById('viewer');

function isMobileScreen() {
    return window.innerWidth <= 768
}

const isMobile = isMobileScreen()

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.name = "sky";
    sky.scale.setScalar( 10 );
    scene.add( sky );

    sun = new THREE.Vector3();

    sunLight.name = "sunLight";
    sunLight.position.set( 1, 1, 1 );
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.left = - 100;
    sunLight.shadow.camera.top	= 100;
    sunLight.shadow.camera.bottom = - 100;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.radius = 2;
    sunLight.shadow.blurSamples = 20;
    sunLight.shadow.bias = - 0.0001;

    ambientLight.name = "ambientLight";

    scene.fog = new THREE.Fog(0x824dec, 0, 100);

    let effectController = {
        turbidity: 0.3,
        rayleigh: 4,
        mieCoefficient: 0.024,
        mieDirectionalG: 0.975,
        elevation: 35.8,
        azimuth: 180,
        exposure: 0.1888
    };

    function guiChanged() {

        const uniforms = sky.material.uniforms;
        uniforms[ 'turbidity' ].value = effectController.turbidity;
        uniforms[ 'rayleigh' ].value = effectController.rayleigh;
        uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient;
        uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation );
        const theta = THREE.MathUtils.degToRad( effectController.azimuth );

        sun.setFromSphericalCoords( 100, phi, theta );
        sunLight.position.copy(sun);
        
        uniforms[ 'sunPosition' ].value.copy( sun );
        sunLight.intensity = sunController.intensity;
        sunLight.color.set(sunController.color); 

        renderer.toneMappingExposure = effectController.exposure;

        ambientLight.intensity = amnientController.intensity;
        ambientLight.color.set(amnientController.color); 

    }

    const skyConfigsGUI = new GUI();
    const gui = skyConfigsGUI.addFolder('Céu')
    const turbidityControl = gui.add(effectController, 'turbidity', 0.0, 20.0, 0.1).onChange(guiChanged);
    const rayleighControl = gui.add(effectController, 'rayleigh', 0.0, 4, 0.001).onChange(guiChanged);
    const mieCoefficientControl = gui.add(effectController, 'mieCoefficient', 0.0, 0.1, 0.001).onChange(guiChanged);
    const mieDirectionalGControl = gui.add(effectController, 'mieDirectionalG', 0.0, 1, 0.001).onChange(guiChanged);
    const elevationControl = gui.add(effectController, 'elevation', 0, 90, 0.1).onChange(guiChanged);
    const azimuthControl = gui.add(effectController, 'azimuth', -180, 180, 0.1).onChange(guiChanged);
    const exposureControl = gui.add(effectController, 'exposure', 0, 1, 0.0001).onChange(guiChanged);

    
    let amnientController = {
        intensity: 5,
        color: '#ffffff'
    };

    let sunController = {
        intensity: 5,
        color: '#ffffff',
        radius: 2
    };

    function activateSunShadows(){
        sunLight.castShadow = !sunLight.castShadow;
    }

    const sun_folder = skyConfigsGUI.addFolder('Sol');
    const sunIntensityControl = sun_folder.add(sunController, 'intensity', 0.0, 20.0, 0.1).onChange(guiChanged);
    const sunColorControl = sun_folder.addColor(sunController, 'color', '#ffffff').name('Cor').onChange(guiChanged);
    sun_folder.add({ activateSunShadows }, 'activateSunShadows').name('Sombras');
    const sunRadiusControl = sun_folder.add(sunController, 'radius', 0, 20, 1).name('Raio').onChange( function ( value ) {
        sunLight.shadow.radius = value;
    } );


    const Ambient = skyConfigsGUI.addFolder('Ambiente');
    const ambientIntensityControl = Ambient.add(amnientController, 'intensity', 0.0, 20.0, 0.1).onChange(guiChanged);
    const ambientColorControl = Ambient.addColor(amnientController, 'color', '#ffffff').name('Color').onChange(guiChanged);

    const presets = skyConfigsGUI.addFolder('Presets')

    function updateGUI() {
        turbidityControl.updateDisplay();
        rayleighControl.updateDisplay();
        mieCoefficientControl.updateDisplay();
        mieDirectionalGControl.updateDisplay();
        elevationControl.updateDisplay();
        azimuthControl.updateDisplay();
        exposureControl.updateDisplay();
        sunIntensityControl.updateDisplay();
        sunColorControl.updateDisplay();
        ambientIntensityControl.updateDisplay();
        ambientColorControl.updateDisplay();
        sunRadiusControl.updateDisplay();

    }

    function setNight2() {
        effectController.turbidity = 0.3;
        effectController.rayleigh = 0.165;
        effectController.mieCoefficient = 0.003;
        effectController.mieDirectionalG = 0.975;
        effectController.elevation = 25.8;
        effectController.azimuth = 180;
        effectController.exposure = 0.01;
        amnientController.intensity = 7;
        amnientController.color = '#824dec';
        sunController.intensity = 6.3;
        sunController.color = '#ffffff';
        guiChanged();
        updateGUI();
    }

    presets.add({ setNight2 }, 'setNight2').name('Noite 2');

    guiChanged();
    sky_config_gui = skyConfigsGUI.domElement;
    sky_config_gui.style.display = 'none';
    setNight2()

    // Geometria de partículas (estrelas)
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000

    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = Math.random() * 200 - 50
        positions[i * 3 + 1] = Math.random() * 200 - 50
        positions[i * 3 + 2] = Math.random() * 20 - 50
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.5
    });

    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

}

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(viewerDiv.clientWidth, viewerDiv.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.VSMShadowMap;
    viewerDiv.appendChild(renderer.domElement);

    const aspect = viewerDiv.clientWidth / viewerDiv.clientHeight;
    const frustumSize = 5;

    cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    cameraPersp.userData = {
        synchronizable: true,
    };
    cameraOrtho = new THREE.OrthographicCamera(
        -frustumSize * aspect,
        frustumSize * aspect,
        frustumSize,
        -frustumSize,
        0.1,
        100
    );
    cameraOrtho.userData = {
        synchronizable: true,
    };
    currentCamera = cameraPersp;

    // Iniciar com visão frontal
    currentCamera.position.set(0, 1, 8)
    currentCamera.lookAt(0, 0, 0)

    scene = new THREE.Scene()
    initSky()

}

let currentCameraX = 0
let currentCameraY = 0
let targetCameraX = 0
let targetCameraY = 0

let currentTranslateX = 0
let currentTranslateY = 0
let targetTranslateX = 0
let targetTranslateY = 0

let currentTranslateXButtons = 0
let currentTranslateYButtons = 0
let targetTranslateXButtons = 0
let targetTranslateYButtons = 0

let currentRotateX = 0
let currentRotateY = 0
let targetRotateX = 0
let targetRotateY = 0

function lerp(start, end, amount) {
    return start + (end - start) * amount 
}

function updateSmoothPositions() {
    currentCameraX = lerp(currentCameraX, targetCameraX, 0.03)
    currentCameraY = lerp(currentCameraY, targetCameraY, 0.03)

    currentCamera.position.x = currentCameraX
    currentCamera.position.y = currentCameraY
    currentCamera.lookAt(0, 0, 0)

    currentTranslateX = lerp(currentTranslateX, targetTranslateX, 0.03)
    currentTranslateY = lerp(currentTranslateY, targetTranslateY, 0.03)

    currentRotateX = lerp(currentRotateX, targetRotateX, 0.05)
    currentRotateY = lerp(currentRotateY, targetRotateY, 0.05)

    screenDiv.style.transform = `translate(-50%, -50%) translate3d(${currentTranslateX}px, ${currentTranslateY}px, 0) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`

    currentTranslateXButtons = lerp(currentTranslateXButtons, targetTranslateXButtons, 0.03)
    currentTranslateYButtons = lerp(currentTranslateYButtons, targetTranslateYButtons, 0.03)

    buttonsContainer.style.transform = `translate(-50%, -50%) translate3d(${currentTranslateXButtons}px, ${currentTranslateYButtons}px, 0) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg)`

    requestAnimationFrame(updateSmoothPositions)
}

function moveScreenWithMouse(event) {
    const mouseX = (event.clientX / window.innerWidth) - 0.5
    const mouseY = (event.clientY / window.innerHeight) - 0.5

    const movementFactor = 10
    const movementFactorButtons = 200

    targetCameraX = Math.max(-3.5, Math.min(3.5, mouseX * 1.5))
    targetCameraY = Math.max(-3.5, Math.min(3.5, -mouseY * 1.0))

    targetTranslateX = -mouseX * movementFactor
    targetTranslateY = -mouseY * movementFactor

    targetRotateX = mouseY * -20;
    targetRotateY = mouseX * -2000

    targetRotateX = targetRotateX;
    targetRotateY = Math.max(-1, Math.min(1, targetRotateY))

    targetTranslateXButtons = -mouseX * movementFactorButtons
    targetTranslateYButtons = -mouseY * movementFactorButtons/2
}

function addParallaxEffect() {
    window.addEventListener('mousemove', (event) => {
        moveScreenWithMouse(event);
    });
}

function importSpecificModel(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {

            const loader = new GLTFLoader();
            loader.parse(arrayBuffer, '', function (gltf) {
                modelScene = gltf.scene;

                modelScene.traverse(function (object) {
                    if (object.isMesh || object.name == 'Plane' || object.name == 'Point002_Orientation' || object.name == 'Point003_Orientation') {
                        object.castShadow = true
                        object.receiveShadow = true
                    }
                });
        
                modelScene.position.set(0, 0, -10);
                modelScene.rotation.y = THREE.MathUtils.degToRad(-89.7);
        
                scene.add(modelScene);
                
            });

        })
        .catch(error => {
            console.error('Erro ao importar o modelo:', error);
        });
}

function onWindowResize() {

    const aspect = viewerDiv.clientWidth / viewerDiv.clientHeight;

    cameraPersp.aspect = aspect;
    cameraPersp.updateProjectionMatrix();

    cameraOrtho.left = cameraOrtho.bottom * aspect;
    cameraOrtho.right = cameraOrtho.top * aspect;
    cameraOrtho.updateProjectionMatrix();

    renderer.setSize( viewerDiv.clientWidth, viewerDiv.clientHeight );

}

window.addEventListener( 'resize', onWindowResize )

let targetColor = new THREE.Color('#000000')
let currentColor = new THREE.Color('#000000')

const transitionSpeed = 0.01; 

function updateLightColors() {

    if (currentColor != targetColor) {

        currentColor.lerp(targetColor, transitionSpeed);

        scene.traverse(function (object) {
            if (object.isLight && object.name != 'Area_Orientation' ) {
                if (object.name == 'Point002_Orientation' || object.name == 'Point003_Orientation' || object.name == 'Point004_Orientation' || object.name == 'Point005_Orientation' || object.name == 'Point006_Orientation') {
                    object.intensity = 500
                    
                    if (!initial && (object.name == 'Point004_Orientation' || object.name == 'Point005_Orientation' || object.name == 'Point006_Orientation')){
                        object.intensity = 50
                        renderer.toneMappingExposure = 0.029;
                    }
                }else {
                    object.color.set(currentColor)
                }
            }
        });

        scene.fog = new THREE.Fog(currentColor, 0, 100);

    } else {
        console.log("nao")
    }
}

function render() {
    requestAnimationFrame(render)
    const delta = clock.getDelta()
    stars.position.copy(currentCamera.position)
    updateLightColors();
    renderer.render( scene, currentCamera )
}

function shockWaveAnimation() {
    const shockwave = document.createElement('div')
    shockwave.classList.add('shockwave')
    document.body.appendChild(shockwave)
    shockwave.addEventListener('animationend', () => {
        shockwave.remove()
    });
}

function initEffects(){
    initial = false
    buttonAbout.style.filter = ""
    buttonAbout.style.background = ""
    myWork.style.filter = ""
    myWork.style.background = ""
    contact.style.filter = ""
    contact.style.background = ""
    addParallaxEffect()
    sound.classList.add('active') 
    backgroundSound.play()
}

function handleMouseMove(event, button) {
    if (initial) {
        const rect = button.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
    
        const offsetX = mouseX - rect.left;
        const offsetY = mouseY - rect.top;
    
        const angle = Math.atan2(offsetY - rect.height / 2, offsetX - rect.width / 2) * (180 / Math.PI) + 90;
    
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
            Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );
    
        const maxDistance = 500;
        const intensity = Math.max(0, 1 - distance / maxDistance);
        const boxShadowIntensity = Math.min(0.15, intensity);
        
        const shadowOffsetX = (offsetX - rect.width / 2) * 0.2 * intensity;
        const shadowOffsetY = (offsetY - rect.height / 2) * 0.2 * intensity;
        
        const maxShadowSize = Math.min(rect.width, rect.height);
        button.style.filter = `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${Math.min(boxShadowIntensity * 100, maxShadowSize)}px rgba(255, 255, 255, ${intensity}))`;
        button.style.background = `linear-gradient(${angle}deg, rgba(0, 0, 0, 0) 40%, rgba(255, 255, 255, ${boxShadowIntensity -0.1}) 80%, rgba(255, 255, 255, ${intensity-0.1}) 120%)`;

        button.style.backgroundClip = "padding-box";
    } else {
        document.removeEventListener('mousemove', handleMouseMove);
    }
}

function initMouseEffect(button) {
    document.addEventListener("mousemove", (event) => handleMouseMove(event, button));
}

initMouseEffect(buttonAbout)
initMouseEffect(myWork)
initMouseEffect(contact)

myWork.addEventListener('mouseenter', () => {
    if (initial) {
        initEffects()
    } else {
        if (!select.paused) {
            select.pause()
            select.currentTime = 0
        }
        select.play();
    }
    shockWaveAnimation()
    about.style.display = 'none'
    iframe.src = 'templates/myWork.html'
    iframeContainer.style.display = 'block'
    screenDiv.classList.remove('screen-theme-default')
    screenDiv.classList.remove('screen-theme1')
    screenDiv.classList.remove('screen-theme3')
    screenDiv.classList.add('screen-theme2')
    targetColor = new THREE.Color('#FF9CDF')
})

buttonAbout.addEventListener('mouseenter', () => {
    if (initial) {
        initEffects()
    } else {
        if (!select.paused) {
            select.pause()
            select.currentTime = 0
        }
        select.play();
    }
    shockWaveAnimation()
    iframe.src = 'templates/about.html'
    iframeContainer.style.display = 'block'
    about.style.display = 'none'
    screenDiv.classList.remove('screen-theme-default')
    screenDiv.classList.remove('screen-theme2')
    screenDiv.classList.remove('screen-theme3')
    screenDiv.classList.add('screen-theme1') 
    targetColor = new THREE.Color('#824dec')
})

contact.addEventListener('mouseenter', () => {
    if (initial) {
        initEffects()
    } else {
        if (!select.paused) {
            select.pause()
            select.currentTime = 0
        }
        select.play();
    }
    shockWaveAnimation()
    iframe.src = 'templates/contact.html'
    iframeContainer.style.display = 'block'
    about.style.display = 'none'
    screenDiv.classList.remove('screen-theme-default')
    screenDiv.classList.remove('screen-theme1')
    screenDiv.classList.remove('screen-theme2')
    screenDiv.classList.add('screen-theme3') 
    targetColor = new THREE.Color('#824dec')
})

sound.addEventListener('click', function () {
    if (sound.classList.contains('active')) {
        backgroundSound.pause()
        backgroundSound.currentTime = 0
    } else {
        backgroundSound.play()
    }
    sound.classList.toggle('active') 
})

window.addEventListener("message", function (event) {
    if (event.data === "iframeClicked") {
        const iframeUrl = iframe.src
        window.location.href = iframeUrl
    }
})

init()
render()
importSpecificModel('model/indexScene.glb')
updateSmoothPositions()

function splashInit() {
    if (modelScene && modelScene.visible) {
        console.log('O modelo já está visível!')
        clearInterval(intervalId)
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none'
        })
    }
}

const intervalId = setInterval(splashInit, 200)