import * as THREE from 'three'
import {
    Scroll
} from '@/scroll'
import gsap from '@/gsap'

import Gl from '../Gl'
import FluidCursor from '../Shaders/FluidCursor/FluidCursor'

import SceneMain from './Scenes/SceneMain'
import SceneSpecs from './Scenes/SceneSpecs'
import SceneFWA from './Scenes/SceneFWA'

export default class World {
    constructor(_params) {
        this.gl = new Gl()

        /* 
          Params
        */
        this.params = _params

        /* 
          Flags
        */
        this.isTransitioning = false

        /* 
          Scenes
        */
        this.selectors = []
        this.scenes = {
            mainA: new SceneMain({
                id: 'main-a',
            }),
            mainB: new SceneMain({
                id: 'main-b',
            }),
            easterEgg: new SceneMain({
                id: 'easter-egg',
                fixedProgress: 0.105,
                camera: 'easter-egg',
            }),
            specs: new SceneSpecs({
                id: 'specs',
            }),
            fwa: new SceneFWA({
                id: 'fwa',
            }),
        }

        /* 
          Mouse
        */
        this.mouse = {
            eased: {
                camera: this.gl.mouse.createEasedNormalized(0.01),
                fresnel: this.gl.mouse.createEasedNormalized(0.05),
            },
        }

        /* 
          Fluid Cursor
        */
        this.fluidCursor = new FluidCursor()

        /* 
          Render Plane
        */
        this.renderPlane = {
            mesh: new THREE.Mesh(
                //
                new THREE.PlaneGeometry(1, 1),
                new THREE.ShaderMaterial({
                    // transparent: true,
                    uniforms: {
                        tCurrent: new THREE.Uniform(null),
                        tPrev: new THREE.Uniform(null),
                        tNoise: new THREE.Uniform(this.gl.assets.textures.noise),
                        tParticles: new THREE.Uniform(null),
                        tFluidCursor: new THREE.Uniform(null),

                        uOpacity: new THREE.Uniform(0),
                        uScale: new THREE.Uniform(new THREE.Vector2(this.gl.sizes.width, this.gl.sizes.height)),
                        uPosition: new THREE.Uniform(new THREE.Vector2(0, 0)),
                        uResolution: new THREE.Uniform(new THREE.Vector2(this.gl.sizes.width, this.gl.sizes.height)),
                        uProgress: new THREE.Uniform(0),
                        uTransition: new THREE.Uniform(0),
                        uBarrelDistort: new THREE.Uniform(0),
                        uBarrelStrength: new THREE.Uniform(1),
                        uAspect: new THREE.Uniform(this.gl.sizes.width / this.gl.sizes.height),
                        uScrollIndicatorCircleRadius: new THREE.Uniform(0.72),
                        uScrollVelocity: new THREE.Uniform(0),
                        uHoverIntensity: new THREE.Uniform(1),

                        COLOR_BLUE: new THREE.Uniform(new THREE.Color(0xabd7ff)),
                        COLOR_LIGHT_BLUE: new THREE.Uniform(new THREE.Color(0xedf7ff)),
                    },
                    vertexShader: /* glsl */ `
            varying vec2 vUv;
            varying vec2 vUvNormalized;

            uniform vec2 uPosition;
            uniform vec2 uScale;
            uniform vec2 uResolution;
            uniform float uAspect;

            void main() {
              vec2 pos = position.xy * 2.0;

              // // Scale
              // pos.x *= uScale.x / uResolution.x;
              // pos.y *= uScale.y / uResolution.y;

              // // Position
              // pos.x += - 1.0 + uPosition.x / uResolution.x * 2. + uScale.x / uResolution.x;
              // pos.y -= uPosition.y / uResolution.y * 2.0;
              
              gl_Position = vec4(pos.xy, 0.0, 1.0);
            
              // Varyings
              vUv = uv;
              vUvNormalized = vec2(uv.x * uAspect, uv.y);
            }
          `,
                    fragmentShader: /* glsl */ `
            #include <PI>
            #include <barrelDistort>
            #include <conicGradient>

            varying vec2 vUv;
            varying vec2 vUvNormalized;

            uniform sampler2D tCurrent;
            uniform sampler2D tPrev;
            uniform sampler2D tNoise;
            uniform sampler2D tParticles;
            uniform sampler2D tFluidCursor;

            uniform float uTransition;
            uniform float uBarrelDistort;
            uniform float uBarrelStrength;
            uniform float uAspect;
            uniform float uOpacity;
            uniform float uProgress;
            uniform float uScrollIndicatorCircleRadius;
            uniform float uScrollVelocity;
            uniform float uHoverIntensity;
            uniform vec3 COLOR_LIGHT_BLUE;
            uniform vec3 COLOR_BLUE;

            const float TRANSITION_WIDTH = 0.35;
            const float TRANSITION_DISTORT_STRENGTH = 0.05;
            const float SCROLL_INDICATOR_CIRCLE_THICKNESS = 0.005;

            
            void main() {
              /* 
                Noise
              */
              float textureNoise = texture2D(tNoise, vUvNormalized ).r;

              /* 
                Fluid Cursor
              */
              vec3 fluidCursor = texture2D(tFluidCursor, vUv * 0.95 + 0.025).rgb;
              
              // Distortion Mask
              float distortionMask = min(smoothstep(0.1, 0.2, vUv.x), smoothstep(0.9, 0.8, vUv.x)) * min(smoothstep(0.1, 0.2, vUv.y), smoothstep(0.9, 0.8, vUv.y));

              /* 
                UVs
              */
              vec2 uv = vUv;
              uv += fluidCursor.r * 0.025 * uHoverIntensity * distortionMask;
              // uv *= (1.0 + sin(uTransition * 3.14) * 0.2);
              // uv -= sin(uTransition * 3.14) * 0.1;

              vec2 distortedUVr = barrelDistort(uv, (-sin(uBarrelDistort * 3.14) * uBarrelStrength - abs(uScrollVelocity) * 0.015 * textureNoise) * 0.25);
              distortedUVr += fluidCursor.r * 0.01 * uHoverIntensity * distortionMask;
              vec2 distortedUVg = barrelDistort(uv, (-sin(uBarrelDistort * 3.14) * uBarrelStrength - abs(uScrollVelocity) * 0.015 * textureNoise) * 0.3);
              distortedUVg += fluidCursor.r * 0.02 * uHoverIntensity * distortionMask;
              vec2 distortedUVb = barrelDistort(uv, (-sin(uBarrelDistort * 3.14) * uBarrelStrength - abs(uScrollVelocity) * 0.015 * textureNoise) * 0.35);
              distortedUVb += fluidCursor.r * 0.03 * uHoverIntensity * distortionMask;
              vec2 uvN = vUv * 2.0 - 1.0;
              vec2 uvNAspect = uvN;


              /* 
                Rotation
              */
              float progressRotation = PI + (uProgress * PI * 2.0) + (uTransition * PI * 2.0);

              /* 
                Empties
              */
              float circleTransition = 0.0;
              float scrollIndicatorDistance = 0.0;
              float scrollIndicatorDot = 0.0;

              /* 
                Aspect Ratio
              */
              if (uAspect > 1.0) {
                uvNAspect = vec2(uvN.x * uAspect, uvN.y);
                circleTransition = length(vec2(uvN.x, uvN.y / uAspect));
                scrollIndicatorDistance = length(uvNAspect);
                scrollIndicatorDot = length(vec2(uvNAspect.x + sin(progressRotation) * uScrollIndicatorCircleRadius, uvNAspect.y + cos(progressRotation) * uScrollIndicatorCircleRadius));
              } else {
                uvNAspect = vec2(uvN.x, uvN.y / uAspect);
                circleTransition = length(vec2(uvN.x * uAspect, uvN.y));
                scrollIndicatorDistance = length(uvNAspect);
                scrollIndicatorDot = length(vec2(uvNAspect.x + sin(progressRotation) * uScrollIndicatorCircleRadius, uvNAspect.y + cos(progressRotation) * uScrollIndicatorCircleRadius));
              }
              
              circleTransition *= 0.5;
              scrollIndicatorDot = pow(smoothstep(0.04, 0.0, scrollIndicatorDot), 2.0);
              scrollIndicatorDot *= 0.5 * smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.0, uTransition); // Opacity

              /* 
                Transition
              */
              float transitionMask = smoothstep(circleTransition, circleTransition + TRANSITION_WIDTH, uTransition);
              float uvDistort = transitionMask * smoothstep(circleTransition + TRANSITION_WIDTH, circleTransition, uTransition);

              /* 
                Scroll Indicator
              */
              float scrollIndicatorGradient = conicGradient(uvNAspect, uProgress, uTransition) * smoothstep(0.0, 0.1, uProgress);
              float scrollIndicatorMask = smoothstep(0.0, 0.25, scrollIndicatorGradient);
              scrollIndicatorMask *= step(scrollIndicatorDistance, uScrollIndicatorCircleRadius) - step(scrollIndicatorDistance, uScrollIndicatorCircleRadius - SCROLL_INDICATOR_CIRCLE_THICKNESS);

              vec3 scrollIndicatorColor = mix(COLOR_LIGHT_BLUE, COLOR_BLUE, smoothstep(0.0, 0.5, scrollIndicatorGradient));

              /* 
                Textures
              */
              float textureCurrentR = texture(tCurrent, vec2(distortedUVr.x, distortedUVr.y - uvDistort * TRANSITION_DISTORT_STRENGTH)).r;
              float textureCurrentG = texture(tCurrent, vec2(distortedUVg.x, distortedUVg.y - uvDistort * TRANSITION_DISTORT_STRENGTH)).g;
              float textureCurrentB = texture(tCurrent, vec2(distortedUVb.x, distortedUVb.y - uvDistort * TRANSITION_DISTORT_STRENGTH)).b;
              vec4 textureCurrent = vec4(textureCurrentR, textureCurrentG, textureCurrentB, 1.0);

              float texturePrevR = texture(tPrev, vec2(distortedUVr.x, distortedUVr.y - uvDistort * TRANSITION_DISTORT_STRENGTH)).r;
              float texturePrevG = texture(tPrev, vec2(distortedUVg.x, distortedUVg.y - uvDistort * TRANSITION_DISTORT_STRENGTH)).g;
              float texturePrevB = texture(tPrev, vec2(distortedUVb.x, distortedUVb.y - uvDistort * TRANSITION_DISTORT_STRENGTH)).b;
              vec4 texturePrev = vec4(texturePrevR, texturePrevG, texturePrevB, 1.0);

              vec4 diffuse = mix(textureCurrent, texturePrev, transitionMask);
              diffuse.rgb = mix(diffuse.rgb, COLOR_BLUE, fluidCursor.r * 0.25);
              // diffuse.a *= uOpacity;

              /* 
                Scroll Edge Highlight
              */
             float scrollEdgeHighlight = pow(length(uvN), 4.0);

              /* 
                Final
              */
              vec3 final = mix(diffuse.rgb, scrollIndicatorColor, scrollIndicatorMask);
              // final = final * (1.0 - scrollIndicatorDot) + (scrollIndicatorDot * COLOR_BLUE) * scrollIndicatorDot;
              final = mix(final, COLOR_BLUE, scrollIndicatorDot);
              // final = vec3(distortionMask);
              // final = mix(final, COLOR_BLUE, );

              /* 
                Debug
              */
              // vec4 textureParticles = texture(tParticles, vUvNormalized * 10.0);
              // final.rgb = mix(final.rgb, textureParticles.rgb, min(floor(vUvNormalized.x * 5.0), 1.0));
              
              gl_FragColor = vec4(final * uOpacity, 1.0);
              // gl_FragColor.a *= uOpacity;
              
              // Debug
              // gl_FragColor.rgb = vec3(vUv.x, vUv.y, 0.0);
              // gl_FragColor.a = 1.0;

              // Tone-mapping pars
              #include <tonemapping_fragment>
              // #include <colorspace_fragment>
            }
          `,
                })
            ),
        }

        this.renderPlane.mesh.frustumCulled = false
        this.renderPlane.mesh.matrixAutoUpdate = false

        this.gl.scene.add(this.renderPlane.mesh)

        /* 
          Functions
        */
        this.setActiveScene(this.params ? .initScene)
        this.createProjectedPointsDOMs()
        this.setVolumeClick()
        if (this.gl.isDebug) this.setDebug()
    }

    createProjectedPointsDOMs() {
        this.projectedPointsDOMs = []

        /* 
          Projection
        */
        this.scenes.mainA.projectedEmpties.forEach((_empty, _index) => {
            this.projectedPointsDOMs.push({
                dom: document.querySelector(`.gl__projected-point--${_empty.name}`),
                name: _empty.name,
            })
        })

        /* 
          Debug
        */
        if (this.gl.isDebug) {
            const styles = document.createElement('style')

            styles.innerHTML = /* css */ `
      .gl__projected-point::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 10px;
        transform: translate(-50%, -50%);
        background-color: yellow;
        z-index: 1000;
      }
      
      .gl__projected-point::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 10px;
        height: 1px;
        transform: translate(-50%, -50%);
        background-color: yellow;
        z-index: 1000;
      }
    `

            this.gl.canvas.appendChild(styles)
        }
    }

    setInteractiveHoverClass(_index) {
        this.projectedPointsDOMs[_index].dom.classList.add('gl__projected-point--hover')
    }

    removeInteractiveHoverClasses() {
        this.projectedPointsDOMs.forEach((_projectedPointDOM) => {
            _projectedPointDOM.dom.classList.remove('gl__projected-point--hover')
        })
    }

    removeAllActiveClassesOnProjectedPoints() {
        this.projectedPointsDOMs.forEach((_projectedPointDOM) => {
            _projectedPointDOM.dom.classList.remove('gl__projected-point--active')
        })
    }

    translateAnimation(_params) {
        this.isTransitioning = true

        const PARAMS = {
            direction: _params.direction != undefined ? _params.direction : 1,
            target: _params.target != undefined ? _params.target : this.scenes.mainA,
            animateTargetScene: _params.animateTargetScene != undefined ? _params.animateTargetScene : false,
            animatePreviousScene: _params.animatePreviousScene != undefined ? _params.animatePreviousScene : false,
        }

        const savedPreviousScene = this.activeScenes.current

        this.removeAllActiveClassesOnProjectedPoints()

        return new Promise((_resolve) => {
            if (PARAMS.direction == 1) {
                document.documentElement.classList.add('gl__is-transitioning')

                this.activeScenes.previous = PARAMS.target

                // Current & Previous
                gsap.fromTo(
                    this.renderPlane.mesh.material.uniforms.uTransition, {
                        value: 0,
                    }, {
                        value: 1,
                        duration: 2,
                        ease: 'power2.inOut',
                        onStart: () => {
                            this.transitionAudio(1)

                            this.activeScenes.previous.isRendering = true
                            this.activeScenes.previous.updateScroll(0)

                            if (PARAMS.animatePreviousScene) {
                                this.activeScenes.current.materialCover.uniforms.uColorTransition.value = 0
                                this.activeScenes.current.materialCover.uniforms.uFresnelTransition.value = 0
                                this.activeScenes.current.materialCover.uniforms.uPosition.value = this.activeScenes.current.coverChild.getWorldPosition(new THREE.Vector3())
                                this.activeScenes.current.revealCase(1, 1.5)
                            }

                            if (PARAMS.animateTargetScene) {
                                this.activeScenes.previous.materialCover.uniforms.uColorTransition.value = 0
                                this.activeScenes.previous.materialCover.uniforms.uFresnelTransition.value = 0
                                this.activeScenes.previous.materialCover.uniforms.uPosition.value = this.activeScenes.previous.coverChild.getWorldPosition(new THREE.Vector3())
                                this.activeScenes.previous.revealCase(1, 1.5)
                            }
                        },
                        onComplete: () => {
                            Scroll.start()

                            Scroll.scrollTo(0, {
                                // duration: 0.1,
                                immediate: true,
                                force: true,
                                lock: true,
                                programmatic: true,
                                onComplete: () => {
                                    this.activeScenes.current = PARAMS.target

                                    setTimeout(() => {
                                        this.renderPlane.mesh.material.uniforms.uTransition.value = 0
                                        this.renderPlane.mesh.material.uniforms.uProgress.value = 0

                                        // Can happen after the transition is complete (no need to do the resolve)
                                        setTimeout(() => {
                                            this.activeScenes.previous = savedPreviousScene

                                            this.activeScenes.previous.isRendering = false
                                        }, 100)

                                        _resolve()

                                        document.documentElement.classList.remove('gl__is-transitioning')

                                        this.isTransitioning = false
                                    }, 100)
                                },
                            })
                        },
                    }
                )

                // Barrel Distort
                gsap.fromTo(
                    this.renderPlane.mesh.material.uniforms.uBarrelDistort, {
                        value: 0,
                    }, {
                        value: 1,
                        duration: 2,
                        ease: 'expo.inOut',
                        onStart: () => {
                            this.renderPlane.mesh.material.uniforms.uBarrelStrength.value = 1
                        },
                    }
                )

                if (PARAMS.animatePreviousScene) {
                    // Case - Fresnel
                    gsap.fromTo(
                        this.activeScenes.current.materialCover.uniforms.uFresnelTransition, {
                            value: 0,
                        }, {
                            value: 3,
                            duration: 1.5,
                            ease: 'power1.inOut',
                            immediateRender: false,
                        }
                    )

                    // Case - Color
                    gsap.fromTo(
                        this.activeScenes.current.materialCover.uniforms.uColorTransition, {
                            value: 0,
                        }, {
                            value: 3,
                            delay: 0.25,
                            duration: 1.5,
                            ease: 'power1.inOut',
                            immediateRender: false,
                        }
                    )

                    // Waves
                    this.activeScenes.current.waves.triggerWave({
                        direction: 1,
                        duration: 3,
                        ease: 'none',
                    })
                }

                if (PARAMS.animateTargetScene) {
                    // Case - Fresnel
                    gsap.fromTo(
                        this.activeScenes.previous.materialCover.uniforms.uFresnelTransition, {
                            value: 0,
                        }, {
                            value: 3,
                            duration: 1.5,
                            ease: 'power1.inOut',
                            immediateRender: false,
                        }
                    )

                    // Case - Color
                    gsap.fromTo(
                        this.activeScenes.previous.materialCover.uniforms.uColorTransition, {
                            value: 0,
                        }, {
                            value: 3,
                            delay: 0.25,
                            duration: 1.5,
                            ease: 'power1.inOut',
                            immediateRender: false,
                        }
                    )

                    // Waves
                    this.activeScenes.previous.waves.triggerWave({
                        direction: 1,
                        duration: 3,
                        ease: 'none',
                    })

                    // Particles
                    this.activeScenes.previous.particles.triggerWave(1, 3)
                }
            } else {
                this.activeScenes.previous.isRendering = true

                document.documentElement.classList.add('gl__is-transitioning')

                Scroll.scrollTo(Scroll.limit, {
                    immediate: true,
                    force: true,
                    lock: true,
                    onComplete: () => {
                        if (this.activeScenes.current == this.scenes.mainA) {
                            this.activeScenes.previous = this.scenes.mainA
                        } else {
                            this.activeScenes.previous = this.scenes.mainB
                        }

                        // Transition between scenes
                        setTimeout(() => {
                            Scroll.stop()

                            gsap.fromTo(
                                this.renderPlane.mesh.material.uniforms.uTransition, {
                                    value: 1,
                                }, {
                                    value: 0,
                                    duration: 3,
                                    ease: 'expo.inOut',
                                    onStart: () => {
                                        this.renderPlane.mesh.material.uniforms.uProgress.value = 1

                                        if (this.activeScenes.current == this.scenes.mainA) {
                                            this.activeScenes.current = this.scenes.mainB
                                        } else {
                                            this.activeScenes.current = this.scenes.mainA
                                        }

                                        this.activeScenes.previous.revealCase(-1)

                                        this.activeScenes.current.isRendering = true
                                        this.activeScenes.current.updateScroll(1)
                                        this.activeScenes.current.revealCase(-1)

                                        this.transitionAudio(-1)
                                    },
                                    onComplete: () => {
                                        this.activeScenes.previous.isRendering = false

                                        this.activeScenes.current.revealCase(1)

                                        _resolve()

                                        document.documentElement.classList.remove('gl__is-transitioning')

                                        this.isTransitioning = false
                                    },
                                }
                            )

                            // Barrel Distort
                            gsap.fromTo(
                                this.renderPlane.mesh.material.uniforms.uBarrelDistort, {
                                    value: 1,
                                }, {
                                    value: 0,
                                    duration: 3,
                                    ease: 'expo.inOut',
                                    onStart: () => {
                                        this.renderPlane.mesh.material.uniforms.uBarrelStrength.value = 1
                                    },
                                }
                            )

                            // Case - Color
                            gsap.fromTo(
                                [this.activeScenes.current.materialCover.uniforms.uColorTransition, this.activeScenes.previous.materialCover.uniforms.uColorTransition], {
                                    value: 3,
                                }, {
                                    value: 0,
                                    // delay: 0.5,
                                    duration: 2,
                                    ease: 'power1.inOut',
                                    immediateRender: false,
                                }
                            )

                            // Case - Fresnel
                            gsap.fromTo(
                                [this.activeScenes.current.materialCover.uniforms.uFresnelTransition, this.activeScenes.previous.materialCover.uniforms.uFresnelTransition], {
                                    value: 3,
                                }, {
                                    value: 0,
                                    // delay: 0.75,
                                    duration: 2,
                                    ease: 'power1.inOut',
                                    immediateRender: false,
                                }
                            )

                            // Waves
                            this.activeScenes.current.waves.triggerWave({
                                direction: -1,
                            })
                            this.activeScenes.previous.waves.triggerWave({
                                direction: -1,
                            })

                            // Particles
                            this.activeScenes.current.particles.triggerWave(-1)
                            this.activeScenes.previous.particles.triggerWave(1, 0)
                        }, 100)
                    },
                })
            }
        })
    }

    transitionAudio(_direction) {
        // console.log(_direction)
        if (_direction == 1) {
            this.gl.audio.animateAudio({
                    muffled: 660
                }, {
                    muffled: 660
                }, {
                    //
                    muffled: 10,
                    duration: 4,
                    ease: 'none',
                },
                (_value) => {
                    // this.gl.assets.audio.synthLoop.filters[0].frequency.setValueAtTime(_value.muffled, this.gl.assets.audio.synthLoop.context.currentTime)
                }
            )
        } else {
            this.gl.audio.animateAudio({
                    muffled: 10
                }, {
                    muffled: 10
                }, {
                    //
                    muffled: 660,
                    duration: 4,
                    ease: 'none',
                },
                (_value) => {
                    // this.gl.assets.audio.synthLoop.filters[0].frequency.setValueAtTime(_value.muffled, this.gl.assets.audio.synthLoop.context.currentTime)
                }
            )
        }
    }

    animateInHomepageScene() {
        gsap.fromTo(
            this.renderPlane.mesh.material.uniforms.uOpacity, {
                value: 0,
            }, {
                value: 1,
                delay: 1,
                duration: 0.5,
                ease: 'none',
            }
        )

        // Barrel Distort
        gsap.fromTo(
            this.renderPlane.mesh.material.uniforms.uBarrelDistort, {
                value: 0,
            }, {
                value: 1,
                duration: 2.5,
                ease: 'power1.out',
                onStart: () => {
                    this.renderPlane.mesh.material.uniforms.uBarrelStrength.value = 1
                },
            }
        )

        this.activeScenes.current.animateIn()
        this.activeScenes.current.revealCase(1, 1)
        this.activeScenes.current.waves.triggerWave({
            direction: 1,
            duration: 6,
            ease: 'power1.out',
        })
        this.activeScenes.current.particles.triggerWave(1, 4, 'back.out(2)', true, 1)
        this.activeScenes.previous.particles.triggerWave(1, 4, 'back.out(2)', true, 1)
    }

    animateInSpecsScene() {
        this.renderPlane.mesh.material.uniforms.uOpacity.value = 1
        this.renderPlane.mesh.material.uniforms.uBarrelDistort.value = 1
    }

    animateInEasterEggScene() {
        this.renderPlane.mesh.material.uniforms.uOpacity.value = 1
        this.renderPlane.mesh.material.uniforms.uBarrelDistort.value = 1

        this.activeScenes.current.revealCase(1, 0, 0)
        this.activeScenes.current.particles.triggerWave(1, 0.1, 'back.out(2)', true)
    }

    // triggerHover() {
    //   gsap.fromTo(
    //     this.renderPlane.mesh.material.uniforms.uBarrelDistort,
    //     {
    //       value: 0,
    //     },
    //     {
    //       value: 1,
    //       duration: 1,
    //       ease: 'power2.inOut',
    //       immediateRender: false,
    //       onStart: () => {
    //         this.renderPlane.mesh.material.uniforms.uBarrelDistort.value = 0
    //         this.renderPlane.mesh.material.uniforms.uBarrelStrength.value = 0.25
    //       },
    //     }
    //   )
    // }

    setActiveScene(_value) {
        /* 
          Reset Scroll
        */
        Scroll.scrollTo(0, {
            immediate: true,
            force: true,
            lock: true,
        })

        this.renderPlane.mesh.material.uniforms.uProgress.value = 0

        /* 
          Set Active Scene
        */
        switch (_value) {
            case 'homepage':
                this.scenes.mainA.isRendering = true
                this.scenes.mainB.isRendering = false
                this.scenes.specs.isRendering = false
                this.scenes.fwa.isRendering = false
                this.scenes.easterEgg.isRendering = false

                this.scenes.mainA.updateScroll(0)

                this.activeScenes = {
                    current: this.scenes.mainA,
                    previous: this.scenes.mainB,
                }

                this.animateInHomepageScene()

                break
            case 'specs':
                this.scenes.mainA.isRendering = false
                this.scenes.mainB.isRendering = false
                this.scenes.specs.isRendering = true
                this.scenes.fwa.isRendering = false
                this.scenes.easterEgg.isRendering = false

                this.scenes.specs.updateScroll(0)

                this.activeScenes = {
                    current: this.scenes.specs,
                    previous: this.scenes.mainB,
                }

                this.animateInSpecsScene()

                break
            case 'fwa':
                this.scenes.mainA.isRendering = false
                this.scenes.mainB.isRendering = false
                this.scenes.specs.isRendering = false
                this.scenes.fwa.isRendering = true
                this.scenes.easterEgg.isRendering = false

                this.scenes.specs.updateScroll(0)

                this.activeScenes = {
                    current: this.scenes.fwa,
                    previous: this.scenes.mainB,
                }

                this.animateInSpecsScene()

                break
            case 'easter-egg':
                this.scenes.mainA.isRendering = false
                this.scenes.mainB.isRendering = false
                this.scenes.specs.isRendering = false
                this.scenes.fwa.isRendering = false
                this.scenes.easterEgg.isRendering = true

                this.scenes.easterEgg.updateScroll() // Empty progress, the progress value was already defined in the scene params

                this.activeScenes = {
                    current: this.scenes.easterEgg,
                    previous: this.scenes.mainB,
                }

                this.animateInEasterEggScene()

                break
        }
    }

    async setActiveSceneAnimated(_value) {
        if (this.isTransitioning) return

        return new Promise(async (_resolve) => {
            Scroll.stop()

            /* 
      Set Active Scene
    */
            switch (_value) {
                case 'homepage':
                    await this.translateAnimation({
                        direction: 1,
                        target: this.scenes.mainA,
                        animateTargetScene: true,
                    })

                    _resolve()

                    break
                case 'specs':
                    await this.translateAnimation({
                        direction: 1,
                        target: this.scenes.specs,
                    })

                    _resolve()

                    break
                case 'fwa':
                    await this.translateAnimation({
                        direction: 1,
                        target: this.scenes.fwa,
                    })

                    _resolve()

                    break
                case 'easter-egg':
                    this.scenes.easterEgg.updateScroll()
                    this.scenes.easterEgg.revealCase(1, 0, 0)
                    this.scenes.easterEgg.particles.triggerWave(1, 0.1, 'back.out(2)', true)

                    await this.translateAnimation({
                        direction: 1,
                        target: this.scenes.easterEgg,
                    })

                    _resolve()

                    break
            }
        })
    }

    setDebug() {
        /* 
          Scene
        */
        this.scenesFolder = this.gl.debug.gui.addFolder('Scene')

        this.scenesFolder
            .add({
                value: 'homepage'
            }, 'value', ['homepage', 'specs', 'easter-egg'])
            .name('Active Scene')
            .onChange((_value) => this.setActiveSceneAnimated(_value))

        /* 
          Main Scene
        */
        this.activeScenesFolder = this.scenesFolder.addFolder('Main Scene Properties').close()

        // Scroll progress
        this.activeScenesFolder
            .add({
                value: 0
            }, 'value')
            .name('Scroll Progress')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.updateScroll(_value)
                this.renderPlane.mesh.material.uniforms.uProgress.value = _value
            })

        this.activeScenesFolder
            .add({
                value: 1
            }, 'value')
            .name('Fresnel Transition')
            .min(0)
            .max(5)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.materialCover.uniforms.uPosition.value = this.activeScenes.current.coverChild.getWorldPosition(new THREE.Vector3())
                this.activeScenes.previous.materialCover.uniforms.uPosition.value = this.activeScenes.previous.coverChild.getWorldPosition(new THREE.Vector3())

                this.activeScenes.current.materialCover.uniforms.uFresnelTransition.value = _value
                this.activeScenes.previous.materialCover.uniforms.uFresnelTransition.value = _value
            })

        this.activeScenesFolder
            .add({
                value: 1
            }, 'value')
            .name('Color Transition')
            .min(0)
            .max(5)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.materialCover.uniforms.uPosition.value = this.activeScenes.current.coverChild.getWorldPosition(new THREE.Vector3())
                this.activeScenes.previous.materialCover.uniforms.uPosition.value = this.activeScenes.previous.coverChild.getWorldPosition(new THREE.Vector3())

                this.activeScenes.current.materialCover.uniforms.uColorTransition.value = _value
                this.activeScenes.previous.materialCover.uniforms.uColorTransition.value = _value
            })

        this.activeScenesFolder
            .add({
                value: 0
            }, 'value')
            .name('Barrel Distortion')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                this.renderPlane.mesh.material.uniforms.uBarrelDistort.value = _value
            })

        this.activeScenesFolder
            .add({
                value: 0
            }, 'value')
            .name('Touch Bar Reveal')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.earphoneTouchPad.material.uniforms.uReveal.value = _value
                this.activeScenes.previous.earphoneTouchPad.material.uniforms.uReveal.value = _value
            })

        /* 
          Camera
        */
        this.cameraFolder = this.activeScenesFolder.addFolder('Camera').close()

        // Camera selection

        this.cameraFolder
            .add({
                value: 'Main Camera'
            }, 'value', ['Main Camera', 'Debug Camera'])
            .name('Camera')
            .onChange((value) => {
                if (value == 'Main Camera') {
                    this.scenes.mainA.activeCamera = this.scenes.mainA.camera
                    this.scenes.mainB.activeCamera = this.scenes.mainB.camera

                    document.querySelector('body').style.pointerEvents = 'all'
                    // this.scenes.mainA.renderScene.camera = this.scenes.mainA.camera
                    // this.scenes.mainB.renderScene.camera = this.scenes.mainB.camera
                } else {
                    this.scenes.mainA.activeCamera = this.scenes.mainA.debugCamera
                    this.scenes.mainB.activeCamera = this.scenes.mainB.debugCamera

                    document.querySelector('body').style.pointerEvents = 'none'
                    // this.scenes.mainA.renderScene.camera = this.scenes.mainA.debugCamera
                    // this.scenes.mainB.renderScene.camera = this.scenes.mainB.debugCamera
                }
            })
        // .setValue('Main Camera')

        // Cursor Intensity
        this.cameraFolder
            .add({
                value: 1
            }, 'value')
            .name('Cursor Position Intensity')
            .min(0)
            .max(3)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.settings.camera.cursorIntensity.position = _value
                this.activeScenes.previous.settings.camera.cursorIntensity.position = _value
            })

        this.cameraFolder
            .add({
                value: 1
            }, 'value')
            .name('Cursor Rotation Intensity')
            .min(0)
            .max(3)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.settings.camera.cursorIntensity.rotation = _value
                this.activeScenes.previous.settings.camera.cursorIntensity.rotation = _value
            })

        /* 
          Idle
        */
        this.idleFolder = this.activeScenesFolder.addFolder('Idle').close()

        this.idleFolder
            .add({
                value: 1
            }, 'value')
            .name('Cursor Idle Intensity')
            .min(0)
            .max(3)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.settings.idle.cursorIntensity.idle = _value
                this.activeScenes.previous.settings.idle.cursorIntensity.idle = _value
            })

        /* 
          Interactivity
        */
        this.helpersFolder = this.activeScenesFolder.addFolder('Helpers').close()

        this.helpersFolder
            .add({
                value: false
            }, 'value')
            .name('Display Scene Helpers')
            .onChange((_value) => {
                for (const helper of this.activeScenes.current.helpers) {
                    helper.visible = _value
                }

                for (const helper of this.activeScenes.previous.helpers) {
                    helper.visible = _value
                }
            })

        this.helpersFolder
            .add({
                value: false
            }, 'value')
            .name('Display Earphone Hover')
            .onChange((_value) => {
                this.activeScenes.current.earphoneLRaycast.visible = _value
                this.activeScenes.current.earphoneRRaycast.visible = _value

                this.activeScenes.previous.earphoneLRaycast.visible = _value
                this.activeScenes.previous.earphoneRRaycast.visible = _value
            })

        this.helpersFolder
            .add({
                value: false
            }, 'value')
            .name('Display Interactivity Hover')
            .onChange((_value) => {
                this.activeScenes.current.earphoneRRaycastSpeaker.visible = _value
                this.activeScenes.current.earphoneRRaycastVolumeUp.visible = _value
                this.activeScenes.current.earphoneRRaycastVolumeDown.visible = _value
                this.activeScenes.current.earphoneRRaycastMic.visible = _value

                this.activeScenes.previous.earphoneRRaycastSpeaker.visible = _value
                this.activeScenes.previous.earphoneRRaycastVolumeUp.visible = _value
                this.activeScenes.previous.earphoneRRaycastVolumeDown.visible = _value
                this.activeScenes.previous.earphoneRRaycastMic.visible = _value
            })

        this.helpersFolder
            .add({
                value: false
            }, 'value')
            .name('Display Particles GPGPU Texture')
            .onChange((_value) => {
                this.debugPlane.visible = _value
            })

        this.helpersFolder
            .add({
                value: false
            }, 'value')
            .name('Bloom')
            .onChange((_value) => {
                this.activeScenes.current.earphoneCoreLBloomHelper.visible = _value
                this.activeScenes.previous.earphoneCoreLBloomHelper.visible = _value
            })

        /* 
          Depth of Field Folder
        */
        this.dofFolder = this.activeScenesFolder.addFolder('Depth of Field').close()

        this.dofFolder
            .add({
                value: 0
            }, 'value')
            .name('Strength')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.particles.particles.material.uniforms.uBokeh.value = _value * 0.9
                this.activeScenes.current.tube.material.uniforms.uBokeh.value = _value * 0.075
            })

        this.dofFolder
            .add({
                value: 0
            }, 'value')
            .name('Distance')
            .min(0)
            .max(15)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.particles.particles.material.uniforms.uFocusDistance.value = _value
            })
        // .setValue(1)

        /* 
          Bloom Folder
        */
        this.bloomFolder = this.activeScenesFolder.addFolder('Bloom').close()

        this.bloomFolder
            .add({
                value: 1
            }, 'value')
            .name('Strength')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.earphoneCoreLBloom.material.uniforms.uOpacity.value = _value
            })

        /* 
          Waves Folder
        */
        this.wavesFolder = this.activeScenesFolder.addFolder('Waves').close()

        this.wavesFolder
            .add({
                value: 3
            }, 'value')
            .name('Light Direction X')
            .min(-3)
            .max(3)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.waves.material.uniforms.uLightDirection.value.x = _value
            })

        this.wavesFolder
            .add({
                value: 3
            }, 'value')
            .name('Light Direction Y')
            .min(-3)
            .max(3)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.waves.material.uniforms.uLightDirection.value.y = _value
            })

        this.wavesFolder
            .add({
                value: -1
            }, 'value')
            .name('Light Direction Z')
            .min(-3)
            .max(3)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.waves.material.uniforms.uLightDirection.value.z = _value
            })

        this.wavesFolder
            .add({
                value: 0
            }, 'value')
            .name('Transition')
            .min(0)
            .max(1)
            .step(0.01)
            .onChange((_value) => {
                this.activeScenes.current.waves.material.uniforms.uWaveTransition.value = _value
            })

        /* 
          Debug Plane
        */
        this.debugPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 1),
            new THREE.ShaderMaterial({
                uniforms: {
                    tDiffuse: {
                        value: null
                    },
                },
                vertexShader: /* glsl */ `
          varying vec2 vUv;

          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

            vUv = uv;
          }
        `,
                fragmentShader: /* glsl */ `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;

          void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            
            gl_FragColor = color;
          }
        `,
            })
        )

        this.debugPlane.visible = false
        this.debugPlane.renderOrder = 1000

        this.targetSize = 0.25

        this.debugPlane.scale.set(this.targetSize, this.targetSize * this.gl.sizes.aspect, 1)
        this.debugPlane.position.set(-1 + this.targetSize * 0.5, -1 + this.targetSize * this.gl.sizes.aspect * 0.5, 0)

        this.gl.scene.add(this.debugPlane)
    }

    add() {
        // for (const key in this.scenes) {
        //   this.gl.scene.add(this.scenes[key].renderPlane.mesh)
        // }
    }

    setHoverIntensity(_direction) {
        if (_direction == 1) {
            gsap.to(this.renderPlane.mesh.material.uniforms.uHoverIntensity, {
                value: 1,
                duration: 0.1,
                ease: 'none',
            })
        } else {
            gsap.to(this.renderPlane.mesh.material.uniforms.uHoverIntensity, {
                value: 0,
                duration: 0.1,
                ease: 'none',
            })
        }
    }

    setVolumeClick() {
        document.addEventListener('click', () => {
            if (this.activeScenes.current.hoveredEarphoneDOM == 'earphone-r-raycast-volume-up') {
                gsap.to(this.activeScenes.current.materialEarphoneBaseR.uniforms.uVolumeShadowUp, {
                    value: 0.25,
                    duration: 0.1,
                    ease: 'none',
                })

                gsap.to(this.activeScenes.current.earphoneRVolume.rotation, {
                    z: this.activeScenes.current.modelsInitialParams.earphoneVolume.rotation.z + 0.035,
                    duration: 0.1,
                    ease: 'none',
                    onComplete: () => {
                        this.activeScenes.current.triggerVolumeHover(1, 'up')
                    },
                })

                gsap.to(this.activeScenes.current.earphoneRVolume.position, {
                    x: this.activeScenes.current.modelsInitialParams.earphoneVolume.position.x - 0.01,
                    duration: 0.1,
                    ease: 'none',
                })

                this.gl.audio.setGlobalVolume(1)
            } else if (this.activeScenes.current.hoveredEarphoneDOM == 'earphone-r-raycast-volume-down') {
                gsap.to(this.activeScenes.current.materialEarphoneBaseR.uniforms.uVolumeShadowDown, {
                    value: 0.25,
                    duration: 0.1,
                    ease: 'none',
                })

                gsap.to(this.activeScenes.current.earphoneRVolume.rotation, {
                    z: this.activeScenes.current.modelsInitialParams.earphoneVolume.rotation.z - 0.035,
                    duration: 0.1,
                    ease: 'none',
                    onComplete: () => {
                        this.activeScenes.current.triggerVolumeHover(1, 'down')
                    },
                })

                gsap.to(this.activeScenes.current.earphoneRVolume.position, {
                    x: this.activeScenes.current.modelsInitialParams.earphoneVolume.position.x - 0.01,
                    duration: 0.1,
                    ease: 'none',
                })

                this.gl.audio.setGlobalVolume(-1)
            }
        })
    }

    destroy() {
        if (this.gl.isDebug) console.log('Before destroy:', this.gl.renderer.instance.info)

        /* 
          Scenes
        */
        for (const key in this.scenes) {
            // Remove everything from the scene and dispose
            this.gl.scene.remove(this.scenes[key].renderPlane.mesh)
            if (this.scenes[key].renderTarget) this.scenes[key].renderTarget.dispose()
            this.scenes[key].renderPlane.mesh.geometry.dispose()
            this.scenes[key].renderPlane.mesh.material.dispose()

            // Remove everything from the scene
            if (this.scenes[key].scene) {
                this.scenes[key].scene.traverse((object) => {
                    this.scenes[key].scene.remove(object.name)

                    if (!object.isMesh) return

                    object.geometry.dispose()

                    if (object.material.isMaterial) {
                        this.cleanMaterial(object.material)
                    } else {
                        // an array of materials
                        for (const material of object.material) this.cleanMaterial(material)
                    }
                })
            }
        }

        this.selectors = []
        this.scenes = []

        // Clear renderer image
        this.gl.renderer.instance.setRenderTarget(null)
        this.gl.renderer.instance.clear()

        if (this.gl.isDebug) console.log('After destroy:', this.gl.renderer.instance.info)
    }

    cleanMaterial(material) {
        material.dispose()

        // dispose textures
        for (const key of Object.keys(material)) {
            const value = material[key]
            if (value && typeof value === 'object' && 'minFilter' in value) {
                value.dispose()
            }
        }
    }

    resize() {
        for (const key in this.scenes) {
            this.scenes[key].resize()
        }

        /* 
          Fluid Cursor
        */
        this.fluidCursor.resize()

        /* 
          Uniforms
        */
        this.renderPlane.mesh.material.uniforms.uAspect.value = this.gl.sizes.width / this.gl.sizes.height

        /* 
          Debug
        */
        if (this.gl.isDebug) {
            this.debugPlane.scale.set(this.targetSize, this.targetSize * this.gl.sizes.aspect, 1)
        }
    }

    update() {
        /* 
          Mouse
        */
        this.mouse.eased.camera.update(this.gl.time.delta)
        this.mouse.eased.fresnel.update(this.gl.time.delta)

        /* 
          Fluid Cursor
        */
        this.fluidCursor.update()
        this.renderPlane.mesh.material.uniforms.tFluidCursor.value = this.fluidCursor.sourceTarget.texture

        /* 
          Scenes
        */
        for (const key in this.scenes) {
            this.scenes[key].update()

            // console.log(this.scenes[key].id, this.scenes[key].isRendering)
        }

        /* 
          Uniforms
        */
        this.renderPlane.mesh.material.uniforms.tCurrent.value = this.activeScenes.current.renderTarget.texture
        this.renderPlane.mesh.material.uniforms.tPrev.value = this.activeScenes.previous.renderTarget.texture

        /* 
          Debug
        */
        if (this.gl.isDebug) {
            if (this.activeScenes.current.id == 'main-a' || this.activeScenes.current.id == 'main-b' || this.activeScenes.current.id == 'easter-egg') {
                this.debugPlane.material.uniforms.tDiffuse.value = this.activeScenes.current.particles.gpgpu.computation.getCurrentRenderTarget(this.activeScenes.current.particles.gpgpu.particlesVariable).texture
            }
        }

        // console.log(Scroll.progress, Scroll.isStopped)

        // console.log(this.renderPlane.mesh.material.uniforms.uTransition.value)
    }
}