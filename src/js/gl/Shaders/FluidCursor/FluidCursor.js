import * as THREE from 'three'
import Gl from '../../Gl'

import Simulation from './classes/Simulation'
import Mouse from './classes/Mouse'

export default class FluidCursor {
    constructor() {
        this.gl = new Gl()

        this.simulation = new Simulation()
        this.mouse = new Mouse()
        this.mouse.init()

        this.scene = new THREE.Scene()
        this.camera = new THREE.Camera()

        this.output = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.RawShaderMaterial({
                vertexShader: /* glsl */ `
          attribute vec3 position;
          uniform vec2 px;
          uniform vec2 boundarySpace;
          varying vec2 uv;

          precision highp float;

          void main() {
            vec3 pos = position;
            vec2 scale = 1.0 - boundarySpace * 2.0;
            pos.xy = pos.xy * scale;
            uv = vec2(0.5)+(pos.xy)*0.5;
            gl_Position = vec4(pos, 1.0);
          }
        `,
                fragmentShader: /* glsl */ `
          precision highp float;
          uniform sampler2D velocity;
          varying vec2 uv;
          uniform vec2 uMouse;

          void main(){
              vec2 uvScaled = uv * 1.5 - (uMouse * 0.25 + 0.25);

              vec2 vel = texture2D(velocity, uv).xy;
              float len = length(vel);
              vel = vel * 0.5 + 0.5;
              
              vec3 color = vec3(vel.x, vel.y, 1.0);
              color = mix(vec3(1.0), color, len);

              float mask = min(smoothstep(0.0, 0.25, uvScaled.x), smoothstep(1.0, 0.75, uvScaled.x));
              mask *= min(smoothstep(0.0, 0.25, uvScaled.y), smoothstep(1.0, 0.75, uvScaled.y));

              gl_FragColor = vec4((1.0 - color), 1.0);
          }
        `,
                uniforms: {
                    velocity: {
                        value: this.simulation.fbos.vel_0.texture,
                    },
                    uMouse: new THREE.Uniform(new THREE.Vector2(0.0, 0.0)),
                    boundarySpace: {
                        value: new THREE.Vector2(),
                    },
                },
            })
        )

        this.scene.add(this.output)

        /* 
          Render Targets
        */
        this.sourceTarget = new THREE.RenderTarget(this.gl.sizes.width, this.gl.sizes.height, {
            samples: 1,
        })

        /* 
          Frame-rate limit
        */
        this.clock = new THREE.Clock()
        this.delta = 0
        this.interval = 1 / 60

        // this.update()
    }

    resize() {
        this.simulation.resize()
    }

    update() {
        // requestAnimationFrame(this.update.bind(this))
        this.delta += this.clock.getDelta()

        if (this.delta > this.interval) {
            this.mouse.update()
            this.simulation.update()

            this.gl.renderer.instance.setRenderTarget(this.sourceTarget)
            this.gl.renderer.instance.render(this.scene, this.camera)

            this.delta = this.delta % this.interval

            this.output.material.uniforms.uMouse.value = this.gl.world.mouse.eased.fresnel.value
        }
    }
}