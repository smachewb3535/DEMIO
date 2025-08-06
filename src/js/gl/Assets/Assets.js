import * as THREE from 'three'

import {
    GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
    RGBELoader
} from 'three/examples/jsm/loaders/RGBELoader.js'
import {
    FontLoader
} from 'three/examples/jsm/loaders/FontLoader.js'
import {
    DRACOLoader
} from 'three/examples/jsm/loaders/DRACOLoader.js'

import gsap from '@/gsap'

import Gl from '../Gl'

export default class Assets {
    constructor() {
        this.gl = new Gl()

        /* 
          Path
        */
        this.path = '/assets'

        /* 
          Loaders
        */
        this.dracoLoader = new DRACOLoader()
        this.dracoLoader.setDecoderPath(this.path + '/draco/')

        this.gltfLoader = new GLTFLoader()
        this.gltfLoader.setDRACOLoader(this.dracoLoader)
        this.rgbeLoader = new RGBELoader()
        this.textureLoader = new THREE.TextureLoader()
        this.fontLoader = new FontLoader()
        this.audioLoader = new THREE.AudioLoader()

        /* 
          Assets
        */
        this.models = {}
        this.textures = {}
        this.hdris = {}
        this.fonts = {}

        /* 
          Progress
        */
        this.promisesProgress = 0
        this.promisesTarget = 0
    }

    customTextureLoader(_path, _target) {
        return new Promise((_resolve) => {
            this.textureLoader.load(
                _path,
                (_result) => {
                    _resolve()

                    _target(_result)

                    this.updateProgressDOM()

                    if (this.gl.isDebug) this.logProgress(_path)
                },
                undefined,
                (_error) => {
                    console.error(_error)
                }
            )
        })
    }

    customModelLoader(_path, _target) {
        return new Promise((_resolve) => {
            this.gltfLoader.load(
                _path,
                (_result) => {
                    _resolve()

                    _target(_result)

                    this.updateProgressDOM()

                    if (this.gl.isDebug) this.logProgress(_path)
                },
                undefined,
                (_error) => {
                    console.error(_error)
                }
            )
        })
    }

    customHdriLoader(_path, _target) {
        return new Promise((_resolve) => {
            this.rgbeLoader.load(
                _path,
                (_result) => {
                    _resolve()

                    _target(_result)

                    this.updateProgressDOM()

                    if (this.gl.isDebug) this.logProgress(_path)
                },
                undefined,
                (_error) => {
                    console.error(_error)
                }
            )
        })
    }

    customFontLoader(_path, _target) {
        return new Promise((_resolve) => {
            this.fontLoader.load(
                _path,
                (_result) => {
                    _resolve()

                    _target(_result)

                    this.updateProgressDOM()

                    if (this.gl.isDebug) this.logProgress(_path)
                },
                undefined,
                (_error) => {
                    console.error(_error)
                }
            )
        })
    }

    customAudioLoader(_path, _target) {
        return new Promise((_resolve) => {
            this.audioLoader.load(
                _path,
                (_result) => {
                    _resolve()

                    // create an AudioListener and add it to the camera
                    const listener = new THREE.AudioListener()
                    this.gl.camera.add(listener)

                    // create an Audio source
                    const sound = new THREE.Audio(listener)
                    const audioContext = sound.context

                    const biquadFilter = audioContext.createBiquadFilter()
                    biquadFilter.type = 'highpass'
                    biquadFilter.frequency.setValueAtTime(10, audioContext.currentTime)

                    sound.setBuffer(_result)
                    sound.setFilter(biquadFilter)
                    // sound.setLoop(true)
                    sound.setVolume(1)

                    _target(sound)

                    this.updateProgressDOM()

                    if (this.gl.isDebug) this.logProgress(_path)
                },
                undefined,
                (_error) => {
                    console.error(_error)
                }
            )
        })
    }

    logProgress(_path) {
        console.info(`[WebGL] [ ${this.promisesProgress}/${this.promises.length} asset loaded ] -`, _path)
    }

    updateProgressDOM() {
        this.promisesProgress++

            gsap.to(this, {
                promisesTarget: this.promisesProgress,
                duration: 2,
                ease: 'power2.inOut',
                onUpdate: () => {
                    document.querySelector('.indicator-w div').textContent = `[ ${Math.floor((this.promisesTarget / this.promises.length) * 100)
          .toString()
          .padStart(3, '0')} ]`
                },
            })
    }

    load() {
        this.promises = []
        this.promisesProgress = 0

        return new Promise(async (_resolve) => {
            /*
              Models
            */
            this.promises.push(
                this.customModelLoader(`${this.path}/models/scene-258.glb`, (_result) => {
                    this.models.scene = _result
                })
            )

            /* 
              Textures
            */
            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/noise-r.png`, (_result) => {
                    this.textures.noise = _result
                    this.textures.noise.wrapS = THREE.RepeatWrapping
                    this.textures.noise.wrapT = THREE.RepeatWrapping
                })
            )

            this.textures.case = {}

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/case-alpha-ao-03.webp`, (_result) => {
                    this.textures.case.alphaAo = _result
                    this.textures.case.alphaAo.colorSpace = THREE.SRGBColorSpace
                    this.textures.case.alphaAo.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/case-emissive-16.webp`, (_result) => {
                    this.textures.case.emissive = _result
                    this.textures.case.emissive.colorSpace = THREE.SRGBColorSpace
                    this.textures.case.emissive.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/case-matcap-mask-01.webp`, (_result) => {
                    this.textures.case.matcapMask = _result
                    this.textures.case.matcapMask.colorSpace = THREE.SRGBColorSpace
                    this.textures.case.matcapMask.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/case-bottom-diffuse-08.webp`, (_result) => {
                    this.textures.case.bottomDiffuse = _result
                    this.textures.case.bottomDiffuse.colorSpace = THREE.LinearSRGBColorSpace
                    this.textures.case.bottomDiffuse.flipY = false
                })
            )

            this.textures.headphones = {}

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-alpha-05.webp`, (_result) => {
                    this.textures.headphones.alpha = _result
                    this.textures.headphones.alpha.colorSpace = THREE.SRGBColorSpace
                    this.textures.headphones.alpha.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-emissive-11.webp`, (_result) => {
                    this.textures.headphones.emissive = _result
                    this.textures.headphones.emissive.colorSpace = THREE.SRGBColorSpace
                    this.textures.headphones.emissive.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-emissive-mask-06.webp`, (_result) => {
                    this.textures.headphones.emissiveMask = _result
                    this.textures.headphones.emissiveMask.colorSpace = THREE.SRGBColorSpace
                    this.textures.headphones.emissiveMask.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-volume-shadow-03.webp`, (_result) => {
                    this.textures.headphones.volumeShadowMask = _result
                    this.textures.headphones.volumeShadowMask.colorSpace = THREE.SRGBColorSpace
                    this.textures.headphones.volumeShadowMask.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-roughness-ao-03.webp`, (_result) => {
                    this.textures.headphones.roughnessAo = _result
                    this.textures.headphones.roughnessAo.colorSpace = THREE.SRGBColorSpace
                    this.textures.headphones.roughnessAo.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-normal-10.webp`, (_result) => {
                    this.textures.headphones.normal = _result
                    // this.textures.headphones.normal.colorSpace = THREE.SRGBColorSpace
                    this.textures.headphones.normal.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/bloom-12.webp`, (_result) => {
                    this.textures.bloom = _result
                    this.textures.bloom.colorSpace = THREE.SRGBColorSpace
                    this.textures.bloom.flipY = false
                })
            )

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/headphone-silicone-19.webp`, (_result) => {
                    this.textures.earphoneSilicone = _result
                    // this.textures.earphoneSilicone.colorSpace = THREE.SRGBColorSpace
                    this.textures.earphoneSilicone.flipY = false
                })
            )

            this.textures.matcap = {}

            this.promises.push(
                this.customTextureLoader(`${this.path}/textures/matcap-glass-01.png`, (_result) => {
                    this.textures.matcap.glass = _result
                    this.textures.matcap.glass.colorSpace = THREE.SRGBColorSpace
                    this.textures.matcap.glass.flipY = false
                })
            )

            /* 
              Audio
            */
            this.audio = {}

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_UI_question-send-03.mp3`, (_result) => {
                    this.audio.uiQuestionSend = _result
                })
            )

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_UI_reply-03.mp3`, (_result) => {
                    this.audio.uiReply = _result
                })
            )

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_UI_menu-close-03.mp3`, (_result) => {
                    this.audio.uiMenuClose = _result
                })
            )

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_UI_ask-Translink-open-03.mp3`, (_result) => {
                    this.audio.uiAskTranslinkOpen = _result
                })
            )

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_UI_menu-open-03.mp3`, (_result) => {
                    this.audio.uiMenuOpen = _result
                })
            )

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_synthloop-03.mp3`, (_result) => {
                    this.audio.synthLoop = _result
                })
            )

            this.promises.push(
                this.customAudioLoader(`${this.path}/audio/Translink_2.5_powerloop-02.mp3`, (_result) => {
                    this.audio.powerLoop = _result
                })
            )

            /* 
              Await
            */
            await Promise.all(this.promises)

            _resolve()

            console.log('[WebGL] [ â–ˆ â–ˆ â–ˆ â–ˆ     ] -', 'Assets loaded')
        })
    }
}