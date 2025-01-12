import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

let cameraPersp, cameraOrtho, currentCamera;
let scene, renderer;

const screenDiv = document.getElementById('screen');
const buttonsContainer = document.getElementById('buttons-container');
const dropy = document.getElementById('dropy');
const about = document.getElementById('about');
const iframeContainer = document.getElementById('iframe-container');
const goTo = document.getElementById('goTo');
const iframe = document.getElementById('iframe');

let sky_config_gui;
let sky, sun;
const sunLight = new THREE.DirectionalLight(0xffffff, 4);
const ambientLight = new THREE.AmbientLight(0xffffff);

const clock = new THREE.Clock();
const viewerDiv = document.getElementById('viewer');

function initSky() {

    // Add Sky
    sky = new Sky();
    sky.name = "sky";
    sky.scale.setScalar( 450000 );
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
    scene.add(sunLight);

    ambientLight.name = "ambientLight";
    scene.add(ambientLight);

    scene.fog = new THREE.Fog(0xFFC8EF, 0, 100);

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
        effectController.exposure = 0.029;
        amnientController.intensity = 7;
        amnientController.color = '#FF9CDF';
        sunController.intensity = 6.3;
        sunController.color = '#ffffff';
        guiChanged();
        updateGUI();
    }

    function setDefault() {
        effectController.turbidity = 0.3;
        effectController.rayleigh = 4;
        effectController.mieCoefficient = 0.024;
        effectController.mieDirectionalG = 0.975;
        effectController.elevation = 35.8;
        effectController.azimuth = 180;
        effectController.exposure = 0.1888;
        amnientController.intensity = 2;
        amnientController.color = '#ffffff';
        sunController.intensity = 5;
        sunController.color = '#ffffff'
        guiChanged(); 
        updateGUI();
    }

    
    presets.add({ setDefault }, 'setDefault').name('Padrão');
    presets.add({ setNight2 }, 'setNight2').name('Noite 2');

    guiChanged();
    sky_config_gui = skyConfigsGUI.domElement;
    sky_config_gui.style.display = 'none';
    setNight2()

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
    currentCamera.position.set(0, 1, 8); // Altere aqui para ajustar a posição inicial
    currentCamera.lookAt(0, 0, 0); // Aponta para o centro da cena

    scene = new THREE.Scene();
    initSky();

}

function addParallaxEffect() {
    const parallaxAmount = 1.5; // Ajuste a sensibilidade
    const maxOffset = 3.5; // Limite máximo de deslocamento

    viewerDiv.addEventListener('mousemove', (event) => {
        const rect = viewerDiv.getBoundingClientRect();
        const mouseX = (event.clientX - rect.left) / rect.width - 0.5;
        const mouseY = (event.clientY - rect.top) / rect.height - 0.5;

        // Calcular o deslocamento da câmera com base no mouse
        const offsetX = Math.max(-maxOffset, Math.min(maxOffset, mouseX * parallaxAmount));
        const offsetY = Math.max(-maxOffset, Math.min(maxOffset, -mouseY * 1.0));

        // Aplicar o deslocamento na posição da câmera
        currentCamera.position.x = offsetX;
        currentCamera.position.y = offsetY; // Manter altura base em 2

        // Manter a câmera apontando para o centro da cena
        currentCamera.lookAt(0, 0, 0);
    });
}

function addCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    cube.userData = {
        "synchronizable": true,
        "interactive": true
    }
    cube.castShadow = true; // Lança sombra
    cube.receiveShadow = true; // Recebe sombra
    cube.position.set(2, 0, 0);
    scene.add(cube);
}

function importSpecificModel(filePath) {
    // `filePath` deve ser o caminho relativo ao arquivo .glb na pasta raiz.
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
                const model = gltf.scene;
        
                model.position.set(0, 0, -10);
                model.rotation.y = THREE.MathUtils.degToRad(-90);
        
                scene.add(model);
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

window.addEventListener( 'resize', onWindowResize );

function render() {
    requestAnimationFrame(render);
    const delta = clock.getDelta(); // Para atualizações baseadas no tempo
    renderer.render( scene, currentCamera );

}

// Função para mover e girar a div com o mouse
function moveScreenWithMouse(event) {
    // Acompanhar a posição do mouse
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1; // Normaliza para o intervalo [-1, 1]
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1; // Normaliza para o intervalo [-1, 1]

    // Definir o fator de movimento
    const movementFactor = 10; // Fator para controlar o movimento da tela
    const movementFactorbuttons = 30; // Fator para controlar o movimento da tela

    // Criar o movimento e rotação
    const translateX = -mouseX * movementFactorbuttons;
    const translateY = mouseY * movementFactorbuttons;
    const rotateX = mouseY * movementFactor;  // Controla a rotação no eixo X
    const rotateY = -mouseX * movementFactor;  // Controla a rotação no eixo Y
    const rotateY2 = mouseY * movementFactorbuttons;  // Controla a rotação no eixo Y

    // Atualiza o estilo da div
    screenDiv.style.transform = `translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    // Atualizando a posição dos botões
    buttonsContainer.style.transform = `translate(-50%, -50%) translate3d(${translateX}px, ${translateY}px, 0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

// Adiciona o evento do mouse para mover a div
window.addEventListener('mousemove', moveScreenWithMouse);
dropy.addEventListener('click', () => {
    about.style.display = 'none'
    iframeContainer.style.display = 'block'
})

goTo.addEventListener('click', function () {
    const iframeUrl = iframe.src; // Obtém a URL que está sendo exibida no iframe
    window.location.href = iframeUrl; // Redireciona para essa URL no site principal
});

// Chamar a função de efeito parallax
init();
render();
//addCube()
importSpecificModel('model/indexScene.glb')
addParallaxEffect();