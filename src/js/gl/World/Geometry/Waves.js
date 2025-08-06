import * as THREE from 'three'
import gsap from '@/gsap'
import Gl from '@/gl/Gl'

export default class Waves {
    constructor() {
        this.gl = new Gl()

        /* 
          Instance
        */
        this.instance = new THREE.Group()

        /* 
          Flags
        */
        this.isAnimating = false

        /* 
          Global
        */
        this.globalSpeed = 1.0

        /* 
          Solid
        */
        this.geometry = new THREE.PlaneGeometry(30, 30, 256, 256)
        this.material = new THREE.ShaderMaterial({
            transparent: true,
            // wireframe: true,
            uniforms: {
                uTime: new THREE.Uniform(0.0),
                uWaveTransition: new THREE.Uniform(0.0),
                uLightIntensity: new THREE.Uniform(1.0),
                uIntensity: new THREE.Uniform(1.0),
                uFrequency: new THREE.Uniform(1.0),
                uLightDirection: new THREE.Uniform(new THREE.Vector3(3.0, 3.0, -1.0)),

                tNoise: new THREE.Uniform(this.gl.assets.textures.noise),

                COLOR_BASE: new THREE.Uniform(new THREE.Color(0x133153)),
                COLOR_HIGHLIGHT: new THREE.Uniform(new THREE.Color(0x32526f)),
                COLOR_LIGHT: new THREE.Uniform(new THREE.Color(0x60b2ff)),
            },
            vertexShader: /* glsl */ `
        #include <orthogonal>

        varying vec2 vUv;
        varying vec2 vUvn;
        varying vec3 vNormal;
        varying float vLight;
        varying float vTransitionLight;
        varying float vTransitionMask;
        varying float vWave;
        varying float vBigWave;

        uniform float uTime;
        uniform float uWaveTransition;
        uniform float uIntensity;
        uniform float uFrequency;
        uniform vec3 uLightDirection;

        uniform sampler2D tNoise;

        const float TRANSITION_SIZE = 2.;
        const float WAVE_STRENGTH = 6.;
        const float LIGHT_WIDTH = 2.0;

        #include <getSmallWave>
        #include <getBigWave>

        void main() {
          vec2 uvN = uv * 2.0 - 1.0;

          /* 
            Texture Noise
          */
          float textureNoise = 1.0 - texture2D(tNoise, uvN * 2.0).r * 2.0;

          /* 
            Light
          */
          vec3 center = position;
          vec3 neighbourX = position + vec3(0.01, 0.0, 0.0);
          vec3 neighbourY = position + vec3(0.0, -0.01, 0.0);

          float bigWave = getBigWave(position) * uIntensity;

          center.z += getSmallWaves(position, textureNoise) + bigWave;
          neighbourX.z += getSmallWaves(neighbourX, textureNoise) + getBigWave(neighbourX) * uIntensity;
          neighbourY.z += getSmallWaves(neighbourY, textureNoise) + getBigWave(neighbourY) * uIntensity;

          vec3 dx = neighbourX - center;
          vec3 dy = neighbourY - center;


          /* 
            Transition wave
          */
          float localPosition = length(position) * 0.5;
          float transitionMask = length(position.x + position.y * 0.25);
          float transitionLight = max(1.0 - distance(localPosition, smoothstep(0.2, 1.0, uWaveTransition) * 5.5) * (LIGHT_WIDTH + (1.0 - smoothstep(0.2, 1.0, uWaveTransition))), 0.0);

          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(center, 1.0);

          /* 
            Varyings
          */
          vTransitionMask = transitionMask;
          vNormal = 1.0 - normalize(cross(dx, dy));
          
          vUv = uv;
          vUvn = uvN;
          vLight = max(dot(vNormal, uLightDirection), 0.0);
          vTransitionLight = transitionLight;
          vWave = center.z;
          vBigWave = bigWave;
        }
      `,
            fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying vec2 vUvn;
        varying vec3 vNormal;
        varying float vLight;
        varying float vTransitionLight;
        varying float vTransitionMask;
        varying float vWave;
        varying float vBigWave;

        uniform float uWaveTransition;
        uniform float uLightIntensity;
        uniform vec3 COLOR_BASE;
        uniform vec3 COLOR_HIGHLIGHT;
        uniform vec3 COLOR_LIGHT;

        void main() {
          float alpha = smoothstep(1.0, 0.5, length(vUvn));
          float centerShadow = smoothstep(0.0, 0.5, length(vUvn));
          float vignette = smoothstep(0.25, 0.75, length(vUvn));
          float centerHighlight = smoothstep(0.0, 0.25, length(vUvn));

          /* 
            Transition Wave
          */
          // transitionWave += pow(vTransition, 2.0);
          // transitionWave *= 1.0 - pow(uWaveTransition, 4.0);

          vec3 color = mix(COLOR_BASE, COLOR_HIGHLIGHT, vLight);
          color += vec3(0.5, 0.75, 1.0) * pow((1.0 - distance(vUv, vec2(0.85, 1.0))) * 4.0, 4.0) * 0.01; // Side Highlight
          color *= min(pow(distance(vUv, vec2(0.0)) * 1.5, 6.0), 1.0); // Side Shadow
          color *= centerShadow; // Center Shadow
          // color *= centerHighlight; // Center shadow
          // color = mix(color, COLOR_LIGHT, (1.0 - centerHighlight) * sin(smoothstep(0.0, 0.25, uWaveTransition) * 3.14) ); // Center Highlight
          color = mix(color, COLOR_BASE, vignette); // Fading on sides
          color *= clamp(vLight * 0.3, 0.0, 1.0); // Contrast
          color *= 1.0 - clamp(vBigWave, 0.0, 1.0) * 0.25; // Big wave highlight
          color = mix(color, COLOR_LIGHT, vTransitionLight * smoothstep(1.0, 0.75, uWaveTransition) * smoothstep(0.0, 0.05, uWaveTransition) * uLightIntensity); // Light transition
          color += smoothstep(0.5, 1.0,vTransitionLight) * 1.25 * smoothstep(1.0, 0.75, uWaveTransition) * smoothstep(0.0, 0.05, uWaveTransition) * smoothstep(3.0, 6., vTransitionMask) * uLightIntensity; // Bright light transition highlight
          color = min(color, 0.65); // Prevent very bright light 
          
          gl_FragColor = vec4(color, alpha);
          
          // gl_FragColor = vec4(vec3(clamp(vLight * 0.4, 0.0, 1.0)), alpha);
        }
      `,
        })

        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.rotation.x = -Math.PI * 0.425
        this.mesh.position.set(0.114, 1.82 - 4, -0.48 - 1.5)
        this.mesh.renderOrder = 1

        this.instance.add(this.mesh)

        /* 
          Wireframe
        */
        this.wireframeMaterial = new THREE.ShaderMaterial({
            transparent: true,
            wireframe: true,
            uniforms: this.material.uniforms,
            depthTest: false,
            vertexShader: /* glsl */ `
        #include <orthogonal>

        varying vec2 vUv;
        varying float vTransitionLight;
        varying float vTransitionMask;
        varying float vWave;

        uniform float uTime;
        uniform float uWaveTransition;     
        uniform float uIntensity;
        uniform float uFrequency;

        uniform sampler2D tNoise;

        const float TRANSITION_SIZE = 2.;
        const float WAVE_STRENGTH = 6.;
        const float LIGHT_WIDTH = 1.0;

        #include <getSmallWave>
        #include <getBigWave>

        void main() {
          /* 
            Texture Noise
          */
          // float textureNoise = texture2D(tNoise, vUv).r;

          /* 
            Light
          */
          vec3 center = position;
          center.z += getSmallWaves(position, 0.0) + getBigWave(position) * uIntensity;

          /* 
            Transition wave
          */
          float localPosition = length(position) * 0.5;
          float transitionMask = length(position.x + position.y * 0.25);
          float transitionLight = max(1.0 - distance(localPosition, smoothstep(0.2, 1.0, uWaveTransition) * 5.5) * (1.0 + (LIGHT_WIDTH - smoothstep(0.2, 1.0, uWaveTransition))), 0.0);

          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(center, 1.0);

          /* 
            Varyings
          */
          vTransitionMask = transitionMask;
          vUv = uv;
          vTransitionLight = transitionLight;
          vWave = center.z;
         
        }
      `,
            fragmentShader: /* glsl */ `
        varying vec2 vUv;
        varying float vTransitionLight;

        uniform float uWaveTransition;
        uniform float uLightIntensity;
        uniform vec3 COLOR_LIGHT;
          
        void main() {        
          gl_FragColor = vec4(COLOR_LIGHT * 1.75, vTransitionLight * sin(smoothstep(0.4, 0.75, uWaveTransition) * 3.14) * uLightIntensity);
          gl_FragColor.rgb = min(gl_FragColor.rgb, 0.65);
        }
      `,
        })

        this.wireframeMesh = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 54, 54), this.wireframeMaterial)
        this.wireframeMesh.rotation.copy(this.mesh.rotation)
        this.wireframeMesh.position.copy(this.mesh.position)
        this.wireframeMesh.renderOrder = 2

        this.instance.add(this.wireframeMesh)
    }

    triggerWave(_params) {
        const params = {
            direction: _params.direction !== undefined ? _params.direction : 1,
            duration: _params.duration !== undefined ? _params.duration : 4.25,
            ease: _params.ease !== undefined ? _params.ease : 'power2.inOut',
            delay: _params.delay !== undefined ? _params.delay : 0,
            intensity: _params.intensity !== undefined ? _params.intensity : 1.0,
            lightIntensity: _params.lightIntensity !== undefined ? _params.lightIntensity : 1.0,
        }

        this.material.uniforms.uLightIntensity.value = params.lightIntensity
        this.material.uniforms.uIntensity.value = params.intensity

        if (params.direction === 1) {
            gsap.fromTo(
                this.material.uniforms.uWaveTransition, {
                    value: 0.0,
                }, {
                    value: 1,
                    delay: params.delay,
                    duration: params.duration,
                    ease: params.ease,
                    onStart: () => {
                        this.isAnimating = true
                    },
                    onUpdate: () => {
                        this.material.uniforms.uTime.value += Math.sin(this.material.uniforms.uWaveTransition.value * Math.PI) * this.gl.time.delta * 0.075
                    },
                    onComplete: () => {
                        this.isAnimating = false
                    },
                }
            )
        } else {
            gsap.fromTo(
                this.material.uniforms.uWaveTransition, {
                    value: 1,
                }, {
                    value: 0,
                    duration: 2.75,
                    ease: 'expo.inOut',
                    onStart: () => {
                        this.isAnimating = true
                    },
                    onUpdate: () => {
                        // this.material.uniforms.uTime.value -= Math.sin(this.material.uniforms.uWaveTransition.value * Math.PI) * 0.05
                    },
                    onComplete: () => {
                        this.isAnimating = false
                    },
                }
            )
        }
    }

    update() {
        const normalizedFrequency = this.gl.audio.frequencies.synthLoop.current * 0.005

        // console.log(this.gl.time.delta)

        this.material.uniforms.uTime.value += (0.25 + this.globalSpeed * 0.75) * this.gl.time.delta * 0.01
        this.material.uniforms.uTime.value += normalizedFrequency * this.gl.time.delta * 0.5

        this.material.uniforms.uFrequency.value = normalizedFrequency

        // console.log(this.gl.audio.analysers.synthLoop)
    }
}