import * as THREE from 'three'
import {
    Line2
} from 'three/addons/lines/Line2.js'
import {
    LineMaterial
} from 'three/addons/lines/LineMaterial.js'
import {
    LineGeometry
} from 'three/addons/lines/LineGeometry.js'
import * as GeometryUtils from 'three/addons/utils/GeometryUtils.js'

import Gl from '@/gl/Gl'

export default class Circles {
    constructor() {
        this.gl = new Gl()

        this.count = 6

        this.curve = new THREE.EllipseCurve(
            0,
            0, // ax, aY
            1,
            1, // xRadius, yRadius
            0,
            2 * Math.PI, // aStartAngle, aEndAngle
            false, // aClockwise
            0 // aRotation
        )

        this.points = this.curve.getPoints(100)

        this.setMaterial()
        this.setInstances()
    }

    setInstances() {
        this.instances = new THREE.Group()

        for (let i = 0; i < this.count; i++) {
            this.instances.add(new Line2(this.createGeometry(), this.material))
        }

        this.instances.children.forEach((_instance, _index) => {
            _instance.computeLineDistances()

            _instance.rotation.set((Math.random() * 2 - 1) * 0.1, 0, (Math.random() * 2 - 1) * 0.1 + Math.PI)
            _instance.scale.set(1 + _index * 0.05, 1 + _index * 0.05, 1 + _index * 0.05)
        })

        this.instances.rotation.set(THREE.MathUtils.degToRad(13) - Math.PI * 0.5, THREE.MathUtils.degToRad(15), THREE.MathUtils.degToRad(-32))
        this.instances.position.set(-5.86, 10, -2.9)
        this.instances.scale.set(16.37, 12.62, 16.37)
        // this.instances.rotation.y = Math.PI / 4
    }

    createGeometry() {
        const geometry = new LineGeometry()
        geometry.setFromPoints(this.points)

        const randomArray = new Float32Array(geometry.attributes.position.count)
        const randomValue = Math.random() * 0.2 // one random value for the whole mesh

        for (let i = 0; i < geometry.attributes.position.count; i++) {
            randomArray[i] = randomValue
        }

        geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomArray, 1))

        return geometry
    }

    setMaterial() {
        this.material = new LineMaterial({
            linewidth: 2, // in world units with size attenuation, pixels otherwise
            dashed: true,
            premultipliedAlpha: true,
            // opacity: 0.9,
            transparent: true,
            // dashSize: 0.1,
            // gapSize: 0.1,

            // worldUnits: true,
        })

        // this.material.depthTest = false

        this.uniforms = {
            uOffset: new THREE.Uniform(0.35),
            uDashSize: new THREE.Uniform(0.175),
            uFadeSize: new THREE.Uniform(0.05),
            uLineLength: new THREE.Uniform(this.curve.getLength()),
            uTime: new THREE.Uniform(0),

            COLOR_HIGHLIGHT: new THREE.Uniform(new THREE.Color(0xffffff)),
            COLOR_DASH: new THREE.Uniform(new THREE.Color(0x41a5ff)),
        }

        this.material.onBeforeCompile = (_shader) => {
            // console.log(_shader.vertexShader)
            // console.log(_shader.fragmentShader)

            _shader.uniforms.uOffset = this.uniforms.uOffset
            _shader.uniforms.uLineLength = this.uniforms.uLineLength
            _shader.uniforms.uDashSize = this.uniforms.uDashSize
            _shader.uniforms.uFadeSize = this.uniforms.uFadeSize
            _shader.uniforms.uTime = this.uniforms.uTime

            _shader.uniforms.COLOR_HIGHLIGHT = this.uniforms.COLOR_HIGHLIGHT
            _shader.uniforms.COLOR_DASH = this.uniforms.COLOR_DASH

            _shader.vertexShader = _shader.vertexShader.replace(
                '#include <common>',
                /* glsl */
                `
          #include <common>

          attribute float aRandom;
          varying float vRandom;
        `
            )

            _shader.vertexShader = _shader.vertexShader.replace(
                '#include <fog_vertex>',
                /* glsl */
                `
          #include <fog_vertex>

          vRandom = aRandom;
        `
            )

            _shader.fragmentShader = _shader.fragmentShader.replace(
                'uniform float linewidth;',
                /* glsl */
                `
          varying float vRandom;

          uniform float linewidth;
          uniform float uOffset;
          uniform float uLineLength;
          uniform float uDashSize;
          uniform float uFadeSize;
          uniform float uTime;

          uniform vec3 COLOR_HIGHLIGHT;
          uniform vec3 COLOR_DASH;
        `
            )

            _shader.fragmentShader = _shader.fragmentShader.replace(
                'if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX',
                /* glsl */
                `
            // if ( mod( vLineDistance + dashOffset, dashSize + gapSize ) > dashSize ) discard; // todo - FIX
          `
            )

            _shader.fragmentShader = _shader.fragmentShader.replace(
                'gl_FragColor = vec4( diffuseColor.rgb, alpha );',
                /* glsl */
                `
          float offset = fract(uOffset - uTime + vRandom);
          float dash = smoothstep(fract(0.0 + uFadeSize + uDashSize + offset), fract(0.0 + uDashSize + offset), vLineDistance / uLineLength) - smoothstep(fract(0.0 + uFadeSize + offset), fract(0.0 + offset), vLineDistance / uLineLength);
          // float dash = length(1.0 - fract(vLineDistance / uLineLength - offset));
          // float highlight = smoothstep(fract(0.0 + uFadeSize + uDashSize + offset + uTime * 4.0), fract(0.0 + uDashSize + offset + uTime * 2.0), vLineDistance / uLineLength) - smoothstep(fract(0.0 + uFadeSize + offset + uTime * 2.0), fract(0.0 + offset + uTime * 2.0), vLineDistance / uLineLength);
          // float dash = smoothstep(0.2 + uOffset, 0.1 + uOffset, vLineDistance / uLineLength - uOffset);
          float highlight = pow(dash, 2.0);
          float cutMask = 1.0 - distance(vLineDistance / uLineLength, 0.5) * 2.0;
          
          // gl_FragColor = vec4( mix(COLOR_DASH, COLOR_HIGHLIGHT, 1.0 - smoothstep(0.0, 0.25, fract(vLineDistance / uLineLength + uTime * 4. + vRandom * 2.))), dash * alpha);
          gl_FragColor = vec4(COLOR_DASH + highlight * 0.25, dash * alpha * cutMask);
          // gl_FragColor = vec4(vec3(cutMask), 1.0);
          // gl_FragColor = vec4( vec3(step(fract(vLineDistance), 0.5)), alpha );
          `
            )
        }
    }

    update() {
        // this.uniforms.uOffset.value = this.gl.time.elapsed * 0.5
        // this.instances.children.forEach((_instance, _index) => {
        //   // if (_index % 2) return
        //   _instance.rotation.z -= this.gl.time.delta * 0.1
        // })

        this.uniforms.uTime.value = this.gl.time.elapsed * 0.5
    }
}