import ShaderPass from './ShaderPass'

export default class Divergence extends ShaderPass {
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
          uniform sampler2D pressure;
          uniform sampler2D velocity;
          uniform vec2 px;
          uniform float dt;
          varying vec2 uv;
          
          void main(){
              float step = 1.0;
          
              float p0 = texture2D(pressure, uv+vec2(px.x * step, 0)).r;
              float p1 = texture2D(pressure, uv-vec2(px.x * step, 0)).r;
              float p2 = texture2D(pressure, uv+vec2(0, px.y * step)).r;
              float p3 = texture2D(pressure, uv-vec2(0, px.y * step)).r;
          
              vec2 v = texture2D(velocity, uv).xy;
              vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
              v = v - gradP * dt;
              gl_FragColor = vec4(v, 0.0, 1.0);
          }
        
        `,
                uniforms: {
                    boundarySpace: {
                        value: simProps.boundarySpace,
                    },
                    pressure: {
                        value: simProps.src_p.texture,
                    },
                    velocity: {
                        value: simProps.src_v.texture,
                    },
                    px: {
                        value: simProps.cellScale,
                    },
                    dt: {
                        value: simProps.dt,
                    },
                },
            },
            output: simProps.dst,
        })

        this.init()
    }

    update({
        vel,
        pressure
    }) {
        this.uniforms.velocity.value = vel.texture
        this.uniforms.pressure.value = pressure.texture
        super.update()
    }
}