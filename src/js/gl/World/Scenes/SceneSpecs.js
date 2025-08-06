import * as THREE from 'three'
import {
    OrbitControls
} from 'three/examples/jsm/controls/OrbitControls.js'
import {
    Scroll
} from '@/scroll'
import gsap, {
    ScrollTrigger
} from '@/gsap'
import ScrollController from '@/modules/ScrollController'

// import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
// import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
// import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
// import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
// import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import Gl from '../../Gl'

import {
    CasePhysicalMaterial,
    EarphoneGlassMaterial,
    EarphoneBaseMaterial,
    CoreMaterial,
    BloomMaterial,
    GoldMaterial,
    TubeMaterial,
    TouchPadMaterial,
    SiliconeMaterial
} from '../../Utils/Materials'

import Circles from '../Geometry/Circles'
import Waves from '../Geometry/Waves'
import Particles from '../Geometry/Particles'

export default class SceneMain {
    constructor(_params) {
        /* 
          Params
        */
        this.params = _params

        /* 
          Setup
        */
        this.id = _params ? .id

        /* 
          Flags
        */
        this.isRendering = false

        /* 
          Settings
        */
        this.settings = {
            camera: {
                cursorIntensity: {
                    position: 1,
                    rotation: 1,
                },
            },
            idle: {
                cursorIntensity: {
                    idle: 1,
                },
            },
        }

        /* 
          GL
        */
        this.gl = new Gl()

        /* 
          Scene
        */
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color(0x133153)
        // this.scene.environment = this.gl.assets.hdris.base

        /* 
          Render Target
        */
        this.renderTarget = new THREE.WebGLRenderTarget(this.gl.sizes.width * this.gl.sizes.pixelRatio, this.gl.sizes.height * this.gl.sizes.pixelRatio, {
            samples: 1,
        })

        /* 
          Functions
        */
        this.setCamera()
        this.setMaterials()
        this.setModels()
        this.setRotationAnimation()
        this.setEmissiveAnimation()

        if (this.gl.isDebug) {
            // this.setOrbitControls()
        }
    }

    setCamera() {
        this.camera = new THREE.PerspectiveCamera(33, this.gl.sizes.width / this.gl.sizes.height, 0.1, 100)
        this.camera.position.set(0, 0, 3.5)
        this.cameraTarget = new THREE.Vector3(0, 0, 0)
        this.scene.add(this.camera)
    }

    setMaterials() {
        this.glassMaterial = EarphoneGlassMaterial({
            // color: 0xff0000,
            metalness: 1,
            roughness: 0,
            // roughnessMap: this.gl.assets.textures.headphones.glassRoughness,
            // opacity: 0,
            // transparent: true,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 2.5,
            emissive: 0xffffff,
            emissiveMap: this.gl.assets.textures.headphones.emissive,
            // alphaMap: this.gl.assets.textures.headphones.alpha,
            emissiveIntensity: 1.25,
            normalMap: this.gl.assets.textures.headphones.normal,
        }, {})

        this.glassMaterial.uniforms.uFresnelTransition.value = 1

        this.baseMaterial = EarphoneBaseMaterial({
            map: this.gl.assets.textures.earphoneSilicone,
            aoMap: this.gl.assets.textures.headphones.roughnessAo,
            aoMapIntensity: 1.1,
            // metalness: 1,
            roughnessMap: this.gl.assets.textures.headphones.roughnessAo,
            // side: THREE.DoubleSide,
            // envMap: this.gl.assets.hdris.base,
            // envMapIntensity: 15,
            // iridescence: 4,
            emissive: 0xffffff,
            emissiveMap: this.gl.assets.textures.headphones.emissive,
            emissiveIntensity: 1,
        }, {})

        this.baseMaterial.uniforms.uFresnelTransition.value = 1
    }

    setModels() {
        this.parent = new THREE.Object3D()
        // this.parent.rotation.set(0, Math.PI / 8, -Math.PI / 16)
        this.scene.add(this.parent)

        this.idle = this.gl.assets.models.scene.scene.getObjectByName('earphone-l-idle').clone()
        this.idle.position.set(-0.25, 0, 0)
        this.idle.rotation.set(Math.PI / 2, 0, 0)
        this.parent.add(this.idle)

        this.instance = this.idle.getObjectByName('earphone-l')
        this.instance.position.set(0, 0, 0)

        this.interactivity = this.idle.getObjectByName('earphone-l-interactivity')

        this.glass = this.idle.getObjectByName('earphone-l-glass')
        this.glass.material = this.glassMaterial

        this.base = this.idle.getObjectByName('earphone-l-base')
        this.base.material = this.baseMaterial

        this.silicone = this.idle.getObjectByName('earphone-l-silicone')
        this.silicone.material = this.baseMaterial

        this.core = this.idle.getObjectByName('earphone-l-core')
        this.core.material = CoreMaterial()

        this.speaker = this.idle.getObjectByName('earphone-l-speaker')
        this.speaker.material = this.baseMaterial

        this.rectangle = this.idle.getObjectByName('earphone-l-rectangle')
        this.rectangle.material = this.baseMaterial

        // this.volumeControl = this.idle.getObjectByName('earphone-l-volume')
        // this.volumeControl.material = this.baseMaterial

        this.idle.getObjectByName('earphone-l-raycast').visible = false
        // this.idle.getObjectByName('earphone-r-raycast-mic').visible = false
        // this.idle.getObjectByName('earphone-r-raycast-speaker').visible = false
        // this.idle.getObjectByName('earphone-r-raycast-volume-up').visible = false
        // this.idle.getObjectByName('earphone-r-raycast-volume-down').visible = false
        // this.idle.getObjectByName('earphone-r-touch-pad').visible = false
    }

    setRotationAnimation() {
        /* 
          Start
        */
        this.rotationTimeline = gsap.timeline({
            paused: true,
        })

        this.rotationTimeline.fromTo(
            this.parent.rotation, {
                y: Math.PI / 8,
                z: -Math.PI / 12,
            }, {
                y: Math.PI * 3.3,
                z: -Math.PI / 5,
                ease: 'none',
                duration: 1,
            }
        )
    }

    setEmissiveAnimation() {
        /* 
          Start
        */
        this.emissiveTimeline = gsap.timeline({
            paused: true,
        })

        this.emissiveTimeline.fromTo(
            this.glass.material.uniforms.uEmissiveTransition, {
                value: 0,
            }, {
                value: 1,
                ease: 'none',
                delay: 2.5,
                duration: 0.5,
            }
        )

        this.emissiveTimeline.fromTo(
            this.glass.material.uniforms.uEmissiveTransition, {
                value: 1,
            }, {
                value: 1,
                ease: 'none',
                // delay: 0.5,
                duration: 1,
                immediateRender: false,
            }
        )
    }

    setOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.gl.canvas)
        this.controls.enableDamping = true
        this.controls.enableZoom = false
    }

    updateScroll(_progress) {
        // console.log('Scroll:', _progress)

        this.rotationTimeline.progress(_progress)
        this.emissiveTimeline.progress(_progress)
    }

    updateCameraAspect() {
        // Camera
        this.camera.aspect = this.gl.sizes.width / this.gl.sizes.height
        this.camera.updateProjectionMatrix()
    }

    renderPipeline() {
        if (!this.isRendering) return

        this.gl.renderer.instance.setRenderTarget(this.renderTarget)
        this.gl.renderer.instance.render(this.scene, this.camera)
    }

    resize() {
        this.renderTarget.setSize(this.gl.sizes.width * this.gl.sizes.pixelRatio, this.gl.sizes.height * this.gl.sizes.pixelRatio)

        this.updateCameraAspect()
    }

    update() {
        if (!this.isRendering) return

        /* 
          Fresnel
        */
        this.glass.material.uniforms.tFluidCursor.value = this.gl.world.fluidCursor.sourceTarget.texture
        this.base.material.uniforms.tFluidCursor.value = this.gl.world.fluidCursor.sourceTarget.texture

        // this.parent.rotation.y += 0.01

        /* 
          Camera
        */
        this.camera.lookAt(this.cameraTarget)

        if (this.gl.sizes.width > 768) {
            this.camera.position.x = -this.gl.world.mouse.eased.camera.value.x * this.settings.camera.cursorIntensity.rotation
            this.camera.position.y = this.gl.world.mouse.eased.camera.value.y * this.settings.camera.cursorIntensity.rotation

            this.camera.rotation.x -= this.gl.world.mouse.eased.camera.value.y * 0.05 * this.settings.camera.cursorIntensity.position
            this.camera.rotation.y += this.gl.world.mouse.eased.camera.value.x * 0.025 * this.settings.camera.cursorIntensity.position
            this.camera.rotation.z = -this.gl.world.mouse.eased.camera.value.y * this.gl.world.mouse.eased.camera.value.x * 0.1 * this.settings.camera.cursorIntensity.position
        }

        /* 
          Debug
        */
        // if (this.gl.isDebug) {
        //   this.controls.update()
        // }
    }
}