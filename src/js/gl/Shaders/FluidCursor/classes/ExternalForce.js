import ShaderPass from './ShaderPass'
import Mouse from './Mouse'

import * as THREE from 'three'

export default class ExternalForce extends ShaderPass {
    constructor(simProps) {
        super({
            output: simProps.dst,
        })

        this.mouse = new Mouse()
        this.mouse.init()

        this.init(simProps)
    }

    init(simProps) {
        super.init()
        const mouseG = new THREE.PlaneGeometry(1, 1)

        this.mouseMaterial = new THREE.RawShaderMaterial({
            vertexShader: /* glsl */ `
        precision highp float;

        attribute vec3 position;
        attribute vec2 uv;
        uniform vec2 center;
        uniform vec2 scale;
        uniform vec2 px;
        varying vec2 vUv;
        
        void main(){
            vec2 pos = position.xy * scale * 2.0 * px + center;
            vUv = uv;
            gl_Position = vec4(pos, 0.0, 1.0);
        }
      
      `,
            fragmentShader: /* glsl */ `
        precision highp float;

        uniform vec2 force;
        uniform vec2 center;
        uniform vec2 scale;
        uniform vec2 px;
        varying vec2 vUv;
        
        void main(){
            vec2 circle = (vUv - 0.5) * 2.0;
            float d = 1.0-min(length(circle), 1.0);
            d *= d;
            gl_FragColor = vec4(force * d, 0, 1);
        }
      
      `,
            blending: THREE.AdditiveBlending,
            uniforms: {
                px: {
                    value: simProps.cellScale,
                },
                force: {
                    value: new THREE.Vector2(0.0, 0.0),
                },
                center: {
                    value: new THREE.Vector2(0.0, 0.0),
                },
                scale: {
                    value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size),
                },
            },
        })

        this.mouseMesh = new THREE.Mesh(mouseG, this.mouseMaterial)
        this.scene.add(this.mouseMesh)
    }

    update(props) {
        this.mouse.update()

        const forceX = (this.mouse.diff.x / 2) * props.mouse_force
        const forceY = (this.mouse.diff.y / 2) * props.mouse_force

        // console.log(props.cursor_size)

        const cursorSizeX = props.cursor_size * props.cellScale.x
        const cursorSizeY = props.cursor_size * props.cellScale.y

        const centerX = Math.min(Math.max(this.mouse.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2)
        const centerY = Math.min(Math.max(this.mouse.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2)

        const uniforms = this.mouseMesh.material.uniforms

        uniforms.force.value.set(forceX, forceY)
        uniforms.center.value.set(centerX, centerY)
        uniforms.scale.value.set(props.cursor_size, props.cursor_size)

        super.update()
    }
}