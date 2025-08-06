import * as THREE from 'three'
import {
    gsap
} from 'gsap'
import Gl from '../Gl'

export default class Audio {
    constructor() {
        this.gl = new Gl()

        /* 
          Flags
        */
        this.isAllowed = false
        this.audioAnimatedIn = false

        /* 
          Default Volumes
        */
        this.defaultVolumes = {
            synthLoop: 1,
            powerLoop: 0.46,
            uiAskTranslinkOpen: 1,
            uiMenuClose: 0.55,
            uiMenuOpen: 0.55,
            uiQuestionSend: 1,
            uiReply: 0.8,
        }

        /* 
          Global Volume
        */
        this.globalVolume = {
            max: 0.2,
            current: 0.2,
            target: 0.2,
        }

        /* 
         Frequencies
        */
        this.frequencies = {
            synthLoop: {
                current: 0,
                target: 0,
            },
        }

        /* 
          Analysers
        */
        this.analysers = {}

        // this.audio = new Audio();
        /* 
          Functions
        */
        // this.handleFirstInteraction()
    }

    init() {
        // this.animateAudioIn()
        this.addAnalysers()

        /* 
          Set Debug
        */
        if (this.gl.isDebug) this.setDebug()
    }

    animateAudioOut() {
        this.gl.assets.audio.synthLoop.stop()
        this.gl.assets.audio.powerLoop.stop()
    }

    animateAudioIn() {
        // if (isAllowed) {
        // if (this.isAllowed) {
        /* 
          Set Flags
        */
        // this.audioAnimatedIn = true

        /* 
          Reveal background audio
        */
        if (!this.gl.assets.audio.synthLoop.isPlaying) {
            this.gl.assets.audio.synthLoop.play()
            this.gl.assets.audio.synthLoop.setLoop(true)
        }

        if (!this.gl.assets.audio.powerLoop.isPlaying) {
            this.gl.assets.audio.powerLoop.play()
            this.gl.assets.audio.powerLoop.setLoop(true)
        }
        this.gl.assets.audio.powerLoop.setVolume(0)

        this.animateAudio({
                volume: 0
            }, {
                volume: 0
            }, {
                //
                volume: 1,
                duration: 1,
                ease: 'power2.inOut',
            },
            (_value) => {
                this.gl.assets.audio.synthLoop.setVolume(_value.volume * this.defaultVolumes.synthLoop)
                // this.gl.assets.audio.powerLoop.setVolume(_value.volume)
            }
        )
        // }
    }

    handleFirstInteraction() {
        document.addEventListener('click', (e) => {
            if (this.isAllowed || !this.gl.isLoaded) return

            /* 
              Set Flags
            */
            this.isAllowed = true

            /* 
              Animate In Audio
            */
            if (!this.audioAnimatedIn && this.gl.isLoaded) this.animateAudioIn()
        })
    }

    addAnalysers() {
        for (const key in this.gl.assets.audio) {
            this.analysers[key] = new THREE.AudioAnalyser(this.gl.assets.audio[key], 32)
        }
    }

    animateAudio(_value, _from, _to, _update) {
        return new Promise((_resolve) => {
            const value = _value

            gsap.fromTo(value, _from, {
                ..._to,
                onUpdate: () => {
                    _update(value)
                },
                onComplete: () => {
                    _resolve()
                },
            })
        })
    }

    setGlobalVolume(_direction) {
        this.globalVolume.target += _direction * 0.025
        this.globalVolume.target = Math.max(0, Math.min(this.globalVolume.max, this.globalVolume.target))
        // this.globalVolume.target = Math.min(1, this.globalVolume.target)

        // console.log(this.globalVolume.target)

        gsap.to(this.globalVolume, {
            current: this.globalVolume.target,
            duration: 0.2,
            ease: 'none',
            onUpdate: () => {
                for (const key in this.gl.assets.audio) {
                    this.gl.assets.audio[key].listener.setMasterVolume(this.globalVolume.current)
                }
            },
        })
    }

    toggleGlobalVolume(_target) {
        // this.globalVolume.target = _target

        gsap.to(this.globalVolume, {
            current: _target,
            duration: 0.4,
            ease: 'none',
            onUpdate: () => {
                for (const key in this.gl.assets.audio) {
                    this.gl.assets.audio[key].listener.setMasterVolume(this.globalVolume.current)
                }
            },
        })
    }

    playUI(_sound, _volume) {
        this.gl.assets.audio[_sound].stop()
        this.gl.assets.audio[_sound].play()

        if (_volume != undefined) {
            this.gl.assets.audio[_sound].setVolume(_volume)
        } else {
            this.gl.assets.audio[_sound].setVolume(this.defaultVolumes[_sound])
        }
    }

    setDebug() {
        const audioFolder = this.gl.debug.gui.addFolder('Audio').close()

        audioFolder
            .add({
                value: 1
            }, 'value')
            .name('Global volume')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                for (const key in this.gl.assets.audio) {
                    this.gl.assets.audio[key].listener.setMasterVolume(_value)
                }
            })

        const individualVolumeFolder = audioFolder.addFolder('Individual Volumes')

        for (const key in this.defaultVolumes) {
            individualVolumeFolder
                .add({
                    value: this.defaultVolumes[key]
                }, 'value')
                .name(key)
                .min(0)
                .max(2)
                .step(0.01)
                .onChange((_value) => {
                    this.defaultVolumes[key] = _value

                    if (key == 'synthLoop') {
                        this.gl.assets.audio.synthLoop.setVolume(_value)
                    }
                })
        }
    }

    update() {
        /* 
          Frequencies
        */
        this.frequencies.synthLoop.current = THREE.MathUtils.damp(this.frequencies.synthLoop.current, this.analysers.synthLoop.getFrequencyData()[5], 0.0025, this.gl.time.delta)

        // console.log(this.analysers.synthLoop.getFrequencyData())
    }
}