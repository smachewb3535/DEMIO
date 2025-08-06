import ShaderPass from './ShaderPass'

import * as THREE from 'three'

export default class Advection extends ShaderPass {
    constructor(simProps) {
        super({
            material: {
                vertexShader: /* glsl */ `
          attribute vec3 position;
          uniform vec2 px;
          uniform vec2 boundarySpace;
          varying vec2 uv;
          
          precision highp float;
          
          void main(){
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
          uniform float dt;
          uniform float dissipation;
          uniform bool isBFECC;
          // uniform float uvScale;
          uniform vec2 fboSize;
          uniform vec2 px;
          varying vec2 uv;
          
          void main(){
              vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
          
              if(isBFECC == false){
                  vec2 vel = texture2D(velocity, uv).xy;
                  vec2 uv2 = uv - vel * dt * ratio;
                  vec2 newVel = texture2D(velocity, uv2).xy * dissipation;
                  gl_FragColor = vec4(newVel, 0.0, 0.0);
              } else {
                  vec2 spot_new = uv;
                  vec2 vel_old = texture2D(velocity, uv).xy;
                  // back trace
                  vec2 spot_old = spot_new - vel_old * dt * ratio;
                  vec2 vel_new1 = texture2D(velocity, spot_old).xy;
          
                  // forward trace
                  vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
                  
                  vec2 error = spot_new2 - spot_new;
          
                  vec2 spot_new3 = spot_new - error / 2.0;
                  vec2 vel_2 = texture2D(velocity, spot_new3).xy;
          
                  // back trace 2
                  vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
                  // gl_FragColor = vec4(spot_old2, 0.0, 0.0);
                  vec2 newVel2 = texture2D(velocity, spot_old2).xy * dissipation; 
                  gl_FragColor = vec4(newVel2, 0.0, 0.0);
              }
          }
        
        `,
                uniforms: {
                    boundarySpace: {
                        value: simProps.cellScale,
                    },
                    px: {
                        value: simProps.cellScale,
                    },
                    fboSize: {
                        value: simProps.fboSize,
                    },
                    velocity: {
                        value: simProps.src.texture,
                    },
                    dt: {
                        value: simProps.dt,
                    },
                    isBFECC: {
                        value: true,
                    },
                    dissipation: {
                        value: simProps.dissipation,
                    },
                },
            },
            output: simProps.dst,
        })

        this.init()
    }

    init() {
        super.init()
        this.createBoundary()
    }

    createBoundary() {
        const boundaryG = new THREE.BufferGeometry()
        const vertices_boundary = new Float32Array([
            // left
            -1, -1, 0, -1, 1, 0,

            // top
            -1, 1, 0, 1, 1, 0,

            // right
            1, 1, 0, 1, -1, 0,

            // bottom
            1, -1, 0, -1, -1, 0,
        ])
        boundaryG.setAttribute('position', new THREE.BufferAttribute(vertices_boundary, 3))

        const boundaryM = new THREE.RawShaderMaterial({
            vertexShader: /* glsl */ `
        attribute vec3 position;
        varying vec2 uv;
        uniform vec2 px;
        
        
        precision highp float;
        
        void main(){
            vec3 pos = position;
            uv = 0.5 + pos.xy * 0.5;
            vec2 n = sign(pos.xy);
            pos.xy = abs(pos.xy) - px * 1.0;
            pos.xy *= n;
            gl_Position = vec4(pos, 1.0);
        }
      `,
            fragmentShader: /* glsl */ `
        precision highp float;
        uniform sampler2D velocity;
        uniform float dt;
        uniform float dissipation;
        uniform bool isBFECC;
        // uniform float uvScale;
        uniform vec2 fboSize;
        uniform vec2 px;
        varying vec2 uv;
        
        void main(){
            vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
        
            if(isBFECC == false){
                vec2 vel = texture2D(velocity, uv).xy;
                vec2 uv2 = uv - vel * dt * ratio;
                vec2 newVel = texture2D(velocity, uv2).xy;
                gl_FragColor = vec4(newVel, 0.0, 0.0);
            } else {
                vec2 spot_new = uv;
                vec2 vel_old = texture2D(velocity, uv).xy;
                // back trace
                vec2 spot_old = spot_new - vel_old * dt * ratio;
                vec2 vel_new1 = texture2D(velocity, spot_old).xy;
        
                // forward trace
                vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
                
                vec2 error = spot_new2 - spot_new;
        
                vec2 spot_new3 = spot_new - error / 2.0;
                vec2 vel_2 = texture2D(velocity, spot_new3).xy;
        
                // back trace 2
                vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
                // gl_FragColor = vec4(spot_old2, 0.0, 0.0);
                vec2 newVel2 = texture2D(velocity, spot_old2).xy * dissipation; 
                gl_FragColor = vec4(newVel2, 0.0, 0.0);
            }
        }
      
      `,
            uniforms: this.uniforms,
        })

        this.line = new THREE.LineSegments(boundaryG, boundaryM)
        this.scene.add(this.line)
    }

    update({
        dt,
        isBounce,
        BFECC
    }) {
        this.uniforms.dt.value = dt
        this.line.visible = isBounce
        this.uniforms.isBFECC.value = BFECC

        super.update()
    }
}