import * as THREE from 'three'
import { Sky } from 'three/addons/objects/Sky.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js'

let cameraPersp, currentCamera
let scene, renderer
let modelScene
let initial = true

const myWork = document.getElementById('my-work')
const contact = document.getElementById('contact')
const screenDiv = document.getElementById("screen")
const neonDiv = document.getElementById("neon-screen")
const iframeAbout = document.getElementById("iframe-about")
const iframeMyWork = document.getElementById("iframe-myWork")
const iframeContact = document.getElementById("iframe-contact")
const buttonAbout = document.getElementById('button-about')
const splashScreen = document.getElementById('splash-screen')

let containerNoSignal = document.getElementById('container-noSignal')
let textoContainer = document.getElementById('texto-container')

const sound = document.getElementById('sound')

const backgroundSound = document.getElementById('background-sound')
const select = document.getElementById('select')
backgroundSound.volume = 0.1
select.volume = 0.1

let sky, sun, stars 

const viewerDiv = document.getElementById('viewer')

const cssRenderer = new CSS3DRenderer()
cssRenderer.domElement.style.position = "absolute"
cssRenderer.domElement.style.top = "0"

let cssObjectButtonAbout
let cssObjectMyWork
let cssObjectContact

let currentCameraX = 0
let currentCameraY = 0
let targetCameraX = 0
let targetCameraY = 0

let targetColor = new THREE.Color('#000000')
let currentColor = new THREE.Color('#000000')

function initSky() {

    sky = new Sky()
    sky.name = "sky"
    sky.scale.setScalar( 10 )
    scene.add( sky )

    sun = new THREE.Vector3()

    scene.fog = new THREE.Fog(0x824dec, 0, 100)

    let effectController = {
        turbidity: 0.3,
        rayleigh: 0.165,
        mieCoefficient: 0.003,
        mieDirectionalG: 0.975,
        elevation: 25.8,
        azimuth: 180,
        exposure: 0.01
    }

    const uniforms = sky.material.uniforms
    uniforms[ 'turbidity' ].value = effectController.turbidity
    uniforms[ 'rayleigh' ].value = effectController.rayleigh
    uniforms[ 'mieCoefficient' ].value = effectController.mieCoefficient
    uniforms[ 'mieDirectionalG' ].value = effectController.mieDirectionalG

    const phi = THREE.MathUtils.degToRad( 90 - effectController.elevation )
    const theta = THREE.MathUtils.degToRad( effectController.azimuth )

    sun.setFromSphericalCoords( 100, phi, theta )
    
    uniforms[ 'sunPosition' ].value.copy( sun )

    renderer.toneMappingExposure = effectController.exposure

    const starGeometry = new THREE.BufferGeometry()
    const starCount = 2000

    const positions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = Math.random() * 200 - 50
        positions[i * 3 + 1] = Math.random() * 200 - 50
        positions[i * 3 + 2] = Math.random() * 20 - 50
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.5
    })

    stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

}

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(viewerDiv.clientWidth, viewerDiv.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.5
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.shadowMap.width = 1024;
    renderer.shadowMap.height = 1024;
    viewerDiv.appendChild(renderer.domElement)
    
    cssRenderer.setSize(viewerDiv.clientWidth, viewerDiv.clientHeight)
    viewerDiv.appendChild(cssRenderer.domElement)

    const aspect = viewerDiv.clientWidth / viewerDiv.clientHeight

    cameraPersp = new THREE.PerspectiveCamera(50, aspect, 0.1, 100)

    currentCamera = cameraPersp

    currentCamera.position.set(0, 1, 8)
    currentCamera.lookAt(0, 0, 0)

    scene = new THREE.Scene()
    initSky()
}

function lerp(start, end, amount) {
    return start + (end - start) * amount 
}

function updateSmoothPositions() {
    currentCameraX = lerp(currentCameraX, targetCameraX, 0.03)
    currentCameraY = lerp(currentCameraY, targetCameraY, 0.03)

    currentCamera.position.x = currentCameraX
    currentCamera.position.y = currentCameraY
    currentCamera.lookAt(0, 0, 0)

    requestAnimationFrame(updateSmoothPositions)
}

function moveScreenWithMouse(event) {
    const mouseX = (event.clientX / window.innerWidth) - 0.5
    const mouseY = (event.clientY / window.innerHeight) - 0.5

    targetCameraX = Math.max(-3.5, Math.min(3.5, mouseX * 1.5))
    targetCameraY = Math.max(-3.5, Math.min(3.5, -mouseY * 1.0))
}

function addParallaxEffect() {
    window.addEventListener('mousemove', moveScreenWithMouse)

    setupIframeParallax(iframeAbout)
    setupIframeParallax(iframeContact)
    setupIframeParallax(iframeMyWork)
}

function setupIframeParallax(iframe) {
    iframe.addEventListener("mouseenter", () => {
        iframe.contentWindow.document.addEventListener("mousemove", (event) => {
            dispatchSimulatedMouseEvent(event, iframe)
        })
    })
}

function dispatchSimulatedMouseEvent(event, iframe) {
    const iframeRect = iframe.getBoundingClientRect()
    
    const simulatedEvent = new MouseEvent("mousemove", {
        bubbles: true,
        clientX: event.clientX + iframeRect.left,
        clientY: event.clientY + iframeRect.top 
    });

    window.dispatchEvent(simulatedEvent)
}

function importSpecificModel(filePath) {
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`)
            }
            return response.arrayBuffer()
        })
        .then(arrayBuffer => {

            const loader = new GLTFLoader()
            loader.parse(arrayBuffer, '', function (gltf) {
                modelScene = gltf.scene

                modelScene.traverse(function (object) {
                    if (object.isMesh || object.name == 'Plane' || object.name == 'Point002_Orientation' || object.name == 'Point003_Orientation') {
                        object.castShadow = true
                        object.receiveShadow = true
                    }
                })
                
                const cssObject = new CSS3DObject(screenDiv)
                cssObject.position.set(0, 0.8, 0)
                cssObject.scale.set(0.008, 0.008, 0.008)
                
                scene.add(cssObject)

                cssObjectButtonAbout = new CSS3DObject(buttonAbout)
                cssObjectButtonAbout.position.set(-1.3, -0.8, 1)
                cssObjectButtonAbout.scale.set(0.008, 0.008, 0.008)
                cssObjectButtonAbout.visible = false
                
                scene.add(cssObjectButtonAbout)

                cssObjectMyWork = new CSS3DObject(myWork)
                cssObjectMyWork.position.set(0, -0.8, 1)
                cssObjectMyWork.scale.set(0.008, 0.008, 0.008)
                cssObjectMyWork.visible = false
                
                scene.add(cssObjectMyWork)

                cssObjectContact = new CSS3DObject(contact)
                cssObjectContact.position.set(1.3, -0.8, 1)
                cssObjectContact.scale.set(0.008, 0.008, 0.008)
                cssObjectContact.visible = false
                
                scene.add(cssObjectContact)
        
                modelScene.position.set(0, 0, -10)
                modelScene.rotation.y = THREE.MathUtils.degToRad(-89.7)
        
                scene.add(modelScene)
            })

        })
        .catch(error => {
            console.error('Erro ao importar o modelo:', error)
        })
}

function onWindowResize() {

    const aspect = viewerDiv.clientWidth / viewerDiv.clientHeight

    cameraPersp.aspect = aspect
    cameraPersp.updateProjectionMatrix()

    renderer.setSize( viewerDiv.clientWidth, viewerDiv.clientHeight )
    
    renderer.setPixelRatio(window.devicePixelRatio)
    cssRenderer.setSize( viewerDiv.clientWidth, viewerDiv.clientHeight )

}

window.addEventListener( 'resize', onWindowResize )

function updateLightColors() {

    if (currentColor != targetColor) {

        currentColor.lerp(targetColor, 0.01)

        scene.traverse(function (object) {
            if (object.isLight && object.name != 'Area_Orientation' ) {
                if (object.name == 'Point002_Orientation' || object.name == 'Point003_Orientation' || object.name == 'Point004_Orientation' || object.name == 'Point005_Orientation' || object.name == 'Point006_Orientation') {
                    object.intensity = 500
                    
                    if (!initial && (object.name == 'Point004_Orientation' || object.name == 'Point005_Orientation' || object.name == 'Point006_Orientation')){
                        object.intensity = 50
                        renderer.toneMappingExposure = 0.029
                    }
                }else {
                    object.color.set(currentColor)
                }
            }
        })

        scene.fog = new THREE.Fog(currentColor, 0, 100)

    }
}

function render(now) {
    requestAnimationFrame(render)
    updateLightColors()
    renderer.render( scene, currentCamera )
    cssRenderer.render(scene, currentCamera)
}

function shockWaveAnimation() {
    const shockwave = document.createElement('div')
    shockwave.classList.add('shockwave')
    document.body.appendChild(shockwave)
    shockwave.addEventListener('animationend', () => {
        shockwave.remove()
    })
}

function initEffects(){
    initial = false
    containerNoSignal.style.display = 'none'
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
        const rect = button.getBoundingClientRect()
        const mouseX = event.clientX
        const mouseY = event.clientY
    
        const offsetX = mouseX - rect.left
        const offsetY = mouseY - rect.top
    
        const angle = Math.atan2(offsetY - rect.height / 2, offsetX - rect.width / 2) * (180 / Math.PI) + 90
    
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const distance = Math.sqrt(
            Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        )
    
        const maxDistance = 500
        const intensity = Math.max(0, 1 - distance / maxDistance)
        const boxShadowIntensity = Math.min(0.15, intensity)
        
        const shadowOffsetX = (offsetX - rect.width / 2) * 0.2 * intensity
        const shadowOffsetY = (offsetY - rect.height / 2) * 0.2 * intensity
        
        const maxShadowSize = Math.min(rect.width, rect.height) === 0 ? 50.0 : Math.min(rect.width, rect.height)
        
        button.style.filter = `drop-shadow(${shadowOffsetX}px ${shadowOffsetY}px ${Math.min(boxShadowIntensity * 100, maxShadowSize)}px rgba(255, 255, 255, ${intensity}))`
        button.style.background = `linear-gradient(${angle}deg, rgba(0, 0, 0, 0) 40%, rgba(255, 255, 255, ${boxShadowIntensity -0.1}) 80%, rgba(255, 255, 255, ${intensity-0.1}) 120%)`

        button.style.backgroundClip = "padding-box"
    } else {
        document.removeEventListener('mousemove', handleMouseMove)
    }
}

document.addEventListener("mousemove", (event) => handleMouseMove(event, buttonAbout))
document.addEventListener("mousemove", (event) => handleMouseMove(event, myWork))
document.addEventListener("mousemove", (event) => handleMouseMove(event, contact))

function manageEffects() {
    initial ? initEffects() : restartAndPlaySelect()
    shockWaveAnimation()
}

function restartAndPlaySelect() {
    if (!select.paused) {
        select.pause()
        select.currentTime = 0
    }
    select.play()
}

function setIframeDisplay(aboutVisible, myWorkVisible, contactVisible) {
    iframeAbout.style.display = aboutVisible ? 'block' : 'none'
    iframeMyWork.style.display = myWorkVisible ? 'block' : 'none'
    iframeContact.style.display = contactVisible ? 'block' : 'none'
}

function updateScreenTheme(theme) {
    screenDiv.className = ''
    screenDiv.classList.add(`screen-theme${theme}`, `screen-theme${theme}-hover`);
}

function updateNeonTheme(theme) {
    neonDiv.className = ''
    neonDiv.classList.add(`neon-theme${theme}`)
}

function handleMouseEnter(section) {
    manageEffects()
    switch (section) {
        case 'myWork':
            setIframeDisplay(false, true, false)
            updateScreenTheme(2)
            updateNeonTheme(2)
            targetColor = new THREE.Color('#FF9CDF')
            break
        case 'about':
            setIframeDisplay(true, false, false)
            updateScreenTheme(1)
            updateNeonTheme(1)
            targetColor = new THREE.Color('#824dec')
            break
        case 'contact':
            setIframeDisplay(false, false, true)
            updateScreenTheme(3)
            updateNeonTheme(3)
            targetColor = new THREE.Color('#00958D')
            break
    }
}

function handleMouseLeave(theme) {
    screenDiv.classList.remove(`screen-theme${theme}-hover`)
}

myWork.addEventListener('mouseenter', () => handleMouseEnter('myWork'))
myWork.addEventListener('mouseleave', () => handleMouseLeave(2))

buttonAbout.addEventListener('mouseenter', () => handleMouseEnter('about'))
buttonAbout.addEventListener('mouseleave', () => handleMouseLeave(1))

contact.addEventListener('mouseenter', () => handleMouseEnter('contact'))
contact.addEventListener('mouseleave', () => handleMouseLeave(3))

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
        console.log(event, event.source.frameElement.src.replace(event.origin, '') )
        const iframeUrl = event.source.frameElement.src.replace(event.origin, '')
        window.location.href = iframeUrl
    }
})

function buttonsAnimateZ() {
    if (Math.abs(cssObjectMyWork.position.z - 4) > 0.01) {
        cssObjectMyWork.position.z += (4 - cssObjectMyWork.position.z) * 0.0001 
        requestAnimationFrame(buttonsAnimateZ)
    } else {
        cssObjectMyWork.position.z = 4
    }

    if (Math.abs(cssObjectButtonAbout.position.z - 4) > 0.01) {
        cssObjectButtonAbout.position.z += (4 - cssObjectButtonAbout.position.z) * 0.0001 
        requestAnimationFrame(buttonsAnimateZ)
    } else {
        cssObjectButtonAbout.position.z = 4
    }

    if (Math.abs(cssObjectContact.position.z - 4) > 0.01) {
        cssObjectContact.position.z += (4 - cssObjectContact.position.z) * 0.0001 
        requestAnimationFrame(buttonsAnimateZ)
    } else {
        cssObjectContact.position.z = 4
    }
}

function initUi() {
    textoContainer.style.display = 'none'
    containerNoSignal.classList.remove('fade-out')
    containerNoSignal.querySelector('h1').remove()
    containerNoSignal.style.display = 'flex'

    document.getElementsByClassName('menus-container')[0].classList.add('menus-container-fade-in')
    
    cssObjectButtonAbout.visible = true
    cssObjectMyWork.visible = true
    cssObjectContact.visible = true
    document.getElementsByClassName('button')[0].classList.add('button-fade-in')
    document.getElementsByClassName('button')[1].classList.add('button-fade-in')
    document.getElementsByClassName('button')[2].classList.add('button-fade-in')
    
    buttonsAnimateZ()
}

function initUserInteraction() {
    containerNoSignal.classList.add('fade-out')

    setTimeout(() => {
        containerNoSignal.style.display = 'none'
        textoContainer.style.display = 'flex'
    }, 500)

    document.getElementById('start').addEventListener('click', () => {
        initUi()
    })
}

init()
render()
importSpecificModel('model/indexScene.glb')
updateSmoothPositions()

function splashInit() {
    if (modelScene && modelScene.visible) {
        clearInterval(intervalId)
        splashScreen.classList.add('fade-out')
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none'
            if (!navigator.userActivation?.hasBeenActive) {
                initUserInteraction()
            }else {
                initUi()
            }
        })
    }
}

const intervalId = setInterval(splashInit, 200)