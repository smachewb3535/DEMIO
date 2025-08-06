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
          uniform sampler2D divergence;
          uniform float straightness;
          uniform vec2 px;
          varying vec2 uv;
          
          void main(){    
              // poisson equation
              float p0 = texture2D(pressure, uv+vec2(px.x * 2.0,  0)).r;
              float p1 = texture2D(pressure, uv-vec2(px.x * 2.0, 0)).r;
              float p2 = texture2D(pressure, uv+vec2(0, px.y * 2.0 )).r;
              float p3 = texture2D(pressure, uv-vec2(0, px.y * 2.0 )).r;
              float div = texture2D(divergence, uv).r;
              
              float newP = (p0 + p1 + p2 + p3) / (4.0 + straightness) - div;
              gl_FragColor = vec4(newP);
          }
        
        `,
                uniforms: {
                    boundarySpace: {
                        value: simProps.boundarySpace,
                    },
                    pressure: {
                        value: simProps.dst_.texture,
                    },
                    divergence: {
                        value: simProps.src.texture,
                    },
                    px: {
                        value: simProps.cellScale,
                    },
                    straightness: {
                        value: simProps.straightness,
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
        iterations
    }) {
        let p_in, p_out

        for (var i = 0; i < iterations; i++) {
            if (i % 2 == 0) {
                p_in = this.props.output0
                p_out = this.props.output1
            } else {
                p_in = this.props.output1
                p_out = this.props.output0
            }

            this.uniforms.pressure.value = p_in.texture
            this.props.output = p_out
            super.update()
        }

        return p_out
    }
}