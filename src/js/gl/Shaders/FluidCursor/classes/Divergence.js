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
          uniform sampler2D velocity;
          uniform float dt;
          uniform vec2 px;
          varying vec2 uv;
          
          void main(){
              float x0 = texture2D(velocity, uv-vec2(px.x, 0)).x;
              float x1 = texture2D(velocity, uv+vec2(px.x, 0)).x;
              float y0 = texture2D(velocity, uv-vec2(0, px.y)).y;
              float y1 = texture2D(velocity, uv+vec2(0, px.y)).y;
              float divergence = (x1-x0 + y1-y0) / 2.0;
          
              gl_FragColor = vec4(divergence / dt);
          }
        
        `,
                uniforms: {
                    boundarySpace: {
                        value: simProps.boundarySpace,
                    },
                    velocity: {
                        value: simProps.src.texture,
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
        vel
    }) {
        this.uniforms.velocity.value = vel.texture
        super.update()
    }
}