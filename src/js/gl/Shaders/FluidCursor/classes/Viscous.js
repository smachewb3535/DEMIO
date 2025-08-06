import ShaderPass from './ShaderPass'

export default class Viscous extends ShaderPass {
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
          uniform sampler2D velocity_new;
          uniform float v;
          uniform vec2 px;
          uniform float dt;
          
          varying vec2 uv;
          
          void main(){
              // poisson equation
              vec2 old = texture2D(velocity, uv).xy;
              vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0)).xy;
              vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0)).xy;
              vec2 new2 = texture2D(velocity_new, uv + vec2(0, px.y * 2.0)).xy;
              vec2 new3 = texture2D(velocity_new, uv - vec2(0, px.y * 2.0)).xy;
          
              vec2 new = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
              new /= 4.0 * (1.0 + v * dt);
              
              gl_FragColor = vec4(new, 0.0, 0.0);
          }
        
        `,
                uniforms: {
                    boundarySpace: {
                        value: simProps.boundarySpace,
                    },
                    velocity: {
                        value: simProps.src.texture,
                    },
                    velocity_new: {
                        value: simProps.dst_.texture,
                    },
                    v: {
                        value: simProps.viscous,
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

            output0: simProps.dst_,
            output1: simProps.dst,
        })

        this.init()
    }

    update({
        viscous,
        iterations,
        dt
    }) {
        let fbo_in, fbo_out
        this.uniforms.v.value = viscous
        for (var i = 0; i < iterations; i++) {
            if (i % 2 == 0) {
                fbo_in = this.props.output0
                fbo_out = this.props.output1
            } else {
                fbo_in = this.props.output1
                fbo_out = this.props.output0
            }

            this.uniforms.velocity_new.value = fbo_in.texture
            this.props.output = fbo_out
            this.uniforms.dt.value = dt

            super.update()
        }

        return fbo_out
    }
}