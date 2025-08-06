import * as THREE from 'three'

import Gl from '../Gl'

export function CasePhysicalMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.MeshStandardMaterial({
        //
        ..._params,
        transparent: true,
        // side: THREE.DoubleSide,
    })

    /* 
      Uniforms
    */
    const uniforms = {
        uPosition: _uniforms.uPosition ? _uniforms.uPosition : new THREE.Uniform(new THREE.Vector3(0, 0, 0)),
        uFresnelTransition: new THREE.Uniform(3),
        uColorTransition: new THREE.Uniform(3),
        uEnvColor: new THREE.Uniform(new THREE.Color(0x182d3d)),
        uEnvIntensity: new THREE.Uniform(1.5),

        tMatcap: new THREE.Uniform(gl.assets.textures.matcap.glass),
        tMatcapMask: new THREE.Uniform(gl.assets.textures.case.matcapMask),

        COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff)),
    }

    /* 
      Shader
    */
    material.onBeforeCompile = (_shader) => {
        // console.log('VERTEX SHADER', _shader.vertexShader)
        // console.log('FRAGMENT SHADER', _shader.fragmentShader)
        /* 
          Uniforms
        */
        _shader.uniforms.uPosition = uniforms.uPosition
        _shader.uniforms.uFresnelTransition = uniforms.uFresnelTransition
        _shader.uniforms.uColorTransition = uniforms.uColorTransition
        _shader.uniforms.uEnvColor = uniforms.uEnvColor
        _shader.uniforms.uEnvIntensity = uniforms.uEnvIntensity

        _shader.uniforms.tMatcap = uniforms.tMatcap
        _shader.uniforms.tMatcapMask = uniforms.tMatcapMask

        _shader.uniforms.COLOR_FRESNEL = uniforms.COLOR_FRESNEL
        /* 
          Vertex
        */
        _shader.vertexShader = _shader.vertexShader.replace(
            'varying vec3 vViewPosition;',
            /* glsl */
            `
        varying vec3 vViewPosition;
        // varying vec3 vWorldPosition;
        varying vec3 vTransformed;
      `
        )

        _shader.vertexShader = _shader.vertexShader.replace(
            '#include <fog_vertex>',
            /* glsl */
            `
        #include <fog_vertex>
        // vWorldPosition = worldPosition.xyz;
        vTransformed = transformed;
      `
        )

        /* 
          Fragment
        */
        _shader.fragmentShader = _shader.fragmentShader.replace(
            'varying vec3 vViewPosition;',
            /* glsl */
            `
        varying vec3 vViewPosition;
        // varying vec3 vWorldPosition;
        varying vec3 vTransformed;

        uniform vec3 uPosition;
        uniform float uFresnelTransition;
        uniform float uColorTransition;
        uniform vec3 uEnvColor;
        uniform float uEnvIntensity;

        uniform sampler2D tMatcap;
        uniform sampler2D tMatcapMask;

        uniform vec3 COLOR_FRESNEL;

        const float TRANSITION_SIZE_FRESNEL = 1.5;
        const float TRANSITION_SIZE_COLOR = 0.75;
      `
        )

        _shader.fragmentShader = _shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            /* glsl */
            `
        #include <dithering_fragment>

        /* 
          Textures
        */
        float textureMatcapMask = 1.0 - texture2D( tMatcapMask, vAoMapUv ).r;

        /* 
          LocalPosition
        */
        float localPosition = length(vTransformed.x) * 0.01;
        // float localPositionMosaic = length(floor((vWorldPosition.xyz - uPosition) * 4.) / 4.);

        /* 
          Transition
        */
        float transitionGap = smoothstep(localPosition, localPosition + TRANSITION_SIZE_COLOR, uColorTransition) * smoothstep(localPosition + TRANSITION_SIZE_COLOR, localPosition , uColorTransition) * 4.0;
        // transitionGap = round(transitionGap * 3.0) / 3.0;
        
        /* 
          Fresnel
        */
        vec3 viewDirection = normalize(vViewPosition);
        float fresnel = 1.0 - dot(viewDirection, vNormal);

        /* 
          Matcap
        */
        vec3 x = normalize( vec3( viewDirection.z, 0.0, -viewDirection.x ) );
        vec3 y = cross( viewDirection, x ); 
        vec2 matcapUV = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; 

        vec3 textureMatcapGlass = texture2D( tMatcap, matcapUV ).rgb;

        /* 
          Colors
        */
        vec3 baseColor = min(outgoingLight + (pow(textureMatcapGlass.r, 3.0) * 0.5 * textureMatcapMask + mix(vec3(1.0), COLOR_FRESNEL, 0.85) * pow(fresnel, 1.0) + pow(fresnel, 3.0) * 1.0) * min(0.25 + step(diffuseColor.a, 0.9), 1.0), 1.0) + (uEnvColor * uEnvIntensity);
        vec3 fresnelColor = min(COLOR_FRESNEL + pow(fresnel, 3.0), 1.0);

        /* 
          Alphas
        */
        float fresnelAlpha = mix(0.0, fresnel, smoothstep(localPosition, localPosition + TRANSITION_SIZE_FRESNEL, uFresnelTransition));
        float colorAlpha = mix(0.0, min(diffuseColor.a + fresnel + totalEmissiveRadiance.r, 1.0), smoothstep(localPosition, localPosition + TRANSITION_SIZE_COLOR, uColorTransition));

        /* 
          Final
        */
        vec3 finalColor = mix(fresnelColor, baseColor, smoothstep(localPosition, localPosition + TRANSITION_SIZE_COLOR, uColorTransition));
        finalColor += vec3(transitionGap * COLOR_FRESNEL);

        vec3 bottomDiffuse = (diffuseColor.rgb + outgoingLight); // pow(diffuseColor.rgb * vec3(0.9, 1.0, 0.9), vec3(1.5)) + outgoingLight;

        gl_FragColor = vec4( mix(bottomDiffuse, finalColor, textureMatcapMask) * ambientOcclusion, max(fresnelAlpha, colorAlpha) );
      `
        )
    }

    material.customProgramCacheKey = () => Math.random().toString()

    material.uniforms = uniforms

    return material
}

export function EarphoneGlassMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.MeshStandardMaterial({
        //
        ..._params,
        transparent: true,
        // side: THREE.DoubleSide,
    })

    /* 
      Uniforms
    */
    const uniforms = {
        tMatcap: new THREE.Uniform(gl.assets.textures.matcap.glass),
        tEmissiveMask: new THREE.Uniform(gl.assets.textures.headphones.emissiveMask),
        tFluidCursor: new THREE.Uniform(null),

        uEmissiveTransition: new THREE.Uniform(0),
        uEmissiveHover: new THREE.Uniform(0),
        uFresnelTransition: new THREE.Uniform(0),
        uEnvColor: new THREE.Uniform(new THREE.Color(0x182d3d)),
        uEnvIntensity: new THREE.Uniform(1.5),

        COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff)),
    }

    /* 
      Shader
    */
    material.onBeforeCompile = (_shader) => {
        // console.log('VERTEX SHADER', _shader.vertexShader)
        // console.log('FRAGMENT SHADER', _shader.fragmentShader)
        /* 
          Uniforms
        */

        _shader.uniforms.tMatcap = uniforms.tMatcap
        _shader.uniforms.tEmissiveMask = uniforms.tEmissiveMask
        _shader.uniforms.tFluidCursor = uniforms.tFluidCursor
        _shader.uniforms.uEmissiveTransition = uniforms.uEmissiveTransition
        _shader.uniforms.uEmissiveHover = uniforms.uEmissiveHover
        _shader.uniforms.uFresnelTransition = uniforms.uFresnelTransition
        _shader.uniforms.uEnvColor = uniforms.uEnvColor
        _shader.uniforms.uEnvIntensity = uniforms.uEnvIntensity

        _shader.uniforms.COLOR_FRESNEL = uniforms.COLOR_FRESNEL
        /* 
          Vertex
        */
        _shader.vertexShader = _shader.vertexShader.replace(
            'varying vec3 vViewPosition;',
            /* glsl */
            `
        varying vec3 vViewPosition;
        // varying vec3 vWorldPosition;
        varying vec3 vTransformed;
        varying vec4 vNormalizedViewPosition;
        // varying float vFresnelDistance;
      `
        )

        _shader.vertexShader = _shader.vertexShader.replace(
            '#include <fog_vertex>',
            /* glsl */
            `
        // float fresnelDistance = distance(uFresnelPosition, worldPosition.xyz);

        #include <fog_vertex>
        // vWorldPosition = worldPosition.xyz;
        vTransformed = transformed;
        vNormalizedViewPosition = projectionMatrix * mvPosition;
        // vFresnelDistance = smoothstep(0.75, 0.25, fresnelDistance);
      `
        )

        /* 
          Fragment
        */
        _shader.fragmentShader = _shader.fragmentShader.replace(
            'varying vec3 vViewPosition;',
            /* glsl */
            `
        varying vec3 vViewPosition;
        // varying vec3 vWorldPosition;
        varying vec3 vTransformed;
        varying vec4 vNormalizedViewPosition;
        // varying float vFresnelDistance;
        
        uniform sampler2D tMatcap;
        uniform sampler2D tEmissiveMask;
        uniform sampler2D tFluidCursor;

        uniform vec3 COLOR_FRESNEL;

        uniform float uEmissiveTransition;
        uniform float uEmissiveHover;
        uniform float uFresnelTransition;
        uniform vec3 uEnvColor;
        uniform float uEnvIntensity;
       
      `
        )

        _shader.fragmentShader = _shader.fragmentShader.replace(
            'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
            /* glsl */
            `
        float textureEmissiveMask = 1.0 - texture2D( tEmissiveMask, vEmissiveMapUv ).r;

        vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance * min(1.0, textureEmissiveMask + max(uEmissiveTransition, uEmissiveHover));
      `
        )

        _shader.fragmentShader = _shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            /* glsl */
            `
        #include <dithering_fragment>

        /* 
          Fluid Cursor
        */
        vec3 fluidCursor = texture2D( tFluidCursor, (vNormalizedViewPosition.xy / vNormalizedViewPosition.w) * 0.5 + 0.5 ).rgb;

        /* 
          Fresnel
        */
        vec3 viewDirection = normalize(vViewPosition);
        float fresnel = 1.0 - dot(viewDirection, normal);
        float fresnelMask = fluidCursor.r + fluidCursor.g + fluidCursor.b;
        fresnelMask = smoothstep(0.0, 0.5, fresnelMask);
        fresnelMask *= uFresnelTransition;

        /* 
          Matcap
        */
        vec3 x = normalize( vec3( viewDirection.z, 0.0, -viewDirection.x ) );
        vec3 y = cross( viewDirection, x ); 
        vec2 matcapUV = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; 

        vec3 textureMatcapGlass = texture2D( tMatcap, matcapUV ).rgb;

        /* 
          Colors
        */
        vec3 baseColor = outgoingLight + (uEnvColor * uEnvIntensity) + mix(vec3(1.0), COLOR_FRESNEL, 0.75) * pow(fresnel, 2.0) + pow(fresnel, 4.0) * 0.5 + pow(textureMatcapGlass.r, 3.0) * 0.1; // Color;
        vec3 fresnelColor = min(COLOR_FRESNEL + pow(fresnel, 3.0), 1.0);

        /* 
          Alpha
        */
        float baseAlpha = 0.9 + baseColor.r * 0.1;
        float fresnelAlpha = max(fresnel, 0.0);

        /* 
          Final
        */
        vec3 finalColor = mix(baseColor, fresnelColor, fresnelMask);
        float finalAlpha = mix(baseAlpha, fresnelAlpha, fresnelMask);

        gl_FragColor = vec4(finalColor, finalAlpha);
      `
        )
    }

    material.customProgramCacheKey = () => Math.random().toString()

    material.uniforms = uniforms

    return material
}

export function EarphoneBaseMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.MeshStandardMaterial({
        //
        ..._params,
        transparent: true,
        // side: THREE.DoubleSide,
    })

    /* 
      Uniforms
    */
    const uniforms = {
        COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff)),

        uFresnelTransition: new THREE.Uniform(0),
        uVolumeUpHover: new THREE.Uniform(0),
        uVolumeDownHover: new THREE.Uniform(0),
        uVolumeShadowUp: new THREE.Uniform(0),
        uVolumeShadowDown: new THREE.Uniform(0),
        uEnvColor: new THREE.Uniform(new THREE.Color(0x182d3d)),
        uEnvIntensity: new THREE.Uniform(15),

        tFluidCursor: new THREE.Uniform(null),
        tEmissiveMask: new THREE.Uniform(gl.assets.textures.headphones.emissiveMask),
        tVolumeShadowMask: new THREE.Uniform(gl.assets.textures.headphones.volumeShadowMask),
        tMatcap: new THREE.Uniform(gl.assets.textures.matcap.glass),
    }

    /* 
      Shader
    */
    material.onBeforeCompile = (_shader) => {
        /* 
          Uniforms
        */
        _shader.uniforms.COLOR_FRESNEL = uniforms.COLOR_FRESNEL
        _shader.uniforms.uFresnelTransition = uniforms.uFresnelTransition
        _shader.uniforms.uVolumeUpHover = uniforms.uVolumeUpHover
        _shader.uniforms.uVolumeDownHover = uniforms.uVolumeDownHover
        _shader.uniforms.uVolumeShadowUp = uniforms.uVolumeShadowUp
        _shader.uniforms.uVolumeShadowDown = uniforms.uVolumeShadowDown
        _shader.uniforms.uEnvColor = uniforms.uEnvColor
        _shader.uniforms.uEnvIntensity = uniforms.uEnvIntensity

        _shader.uniforms.tFluidCursor = uniforms.tFluidCursor
        _shader.uniforms.tEmissiveMask = uniforms.tEmissiveMask
        _shader.uniforms.tVolumeShadowMask = uniforms.tVolumeShadowMask
        _shader.uniforms.tMatcap = uniforms.tMatcap

        /* 
          Vertex
        */
        _shader.vertexShader = _shader.vertexShader.replace(
            'varying vec3 vViewPosition;',
            /* glsl */
            `
        varying vec3 vViewPosition;
        varying vec3 vTransformed;
        varying vec4 vNormalizedViewPosition;
      `
        )

        _shader.vertexShader = _shader.vertexShader.replace(
            '#include <fog_vertex>',
            /* glsl */
            `
        #include <fog_vertex>
        vTransformed = transformed;
        vNormalizedViewPosition = projectionMatrix * mvPosition;
      `
        )

        /* 
          Fragment
        */
        _shader.fragmentShader = _shader.fragmentShader.replace(
            'varying vec3 vViewPosition;',
            /* glsl */
            `
        varying vec3 vViewPosition;
        varying vec3 vTransformed;
        varying vec4 vNormalizedViewPosition;

        uniform float uFresnelTransition;
        uniform float uVolumeUpHover;
        uniform float uVolumeDownHover;
        uniform float uVolumeShadowUp;
        uniform float uVolumeShadowDown;
        uniform vec3 uEnvColor;
        uniform float uEnvIntensity;

        uniform sampler2D tFluidCursor;
        uniform sampler2D tEmissiveMask;
        uniform sampler2D tVolumeShadowMask;
        uniform sampler2D tMatcap;

        uniform vec3 COLOR_FRESNEL;
      `
        )

        _shader.fragmentShader = _shader.fragmentShader.replace(
            'vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;',
            /* glsl */
            `
        vec3 textureEmissiveMask = texture2D( tEmissiveMask, vEmissiveMapUv ).rgb;
        vec3 textureVolumeShadowMask = texture2D( tVolumeShadowMask, vEmissiveMapUv ).rgb;

        /* 
          Hover emission
        */
        float hoverMaskUp = textureEmissiveMask.g * (0.75 + uVolumeUpHover * 0.5);
        float hoverMaskDown = textureEmissiveMask.b * (0.75 + uVolumeDownHover * 0.5);

        /* 
          Shadow on volume
        */
        float shadowUp = textureVolumeShadowMask.g * uVolumeShadowUp;
        float shadowDown = textureVolumeShadowMask.b * uVolumeShadowDown;

        vec3 outgoingLight = (uEnvColor * uEnvIntensity) * ambientOcclusion + (totalDiffuse - (shadowUp + shadowDown)) + totalSpecular + totalEmissiveRadiance * (hoverMaskUp + hoverMaskDown);
      `
        )

        _shader.fragmentShader = _shader.fragmentShader.replace(
            '#include <dithering_fragment>',
            /* glsl */
            `
        #include <dithering_fragment>

        /* 
          Fluid Cursor
        */
        vec3 fluidCursor = texture2D( tFluidCursor, (vNormalizedViewPosition.xy / vNormalizedViewPosition.w) * 0.5 + 0.5 ).rgb;

        /* 
          Fresnel
        */
        vec3 viewDirection = normalize(vViewPosition);
        float fresnel = 1.0 - dot(viewDirection, normal);
        float fresnelMask = fluidCursor.r + fluidCursor.g + fluidCursor.b;
        fresnelMask = smoothstep(0.0, 0.5, fresnelMask);
        fresnelMask *= uFresnelTransition;

        /* 
          Matcap
        */
        vec3 x = normalize( vec3( viewDirection.z, 0.0, -viewDirection.x ) );
        vec3 y = cross( viewDirection, x ); 
        vec2 matcapUV = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; 

        float textureMatcapMetallic = texture2D( tMatcap, matcapUV ).r;

        /* 
          Color
        */
        vec3 fresnelColor = min(COLOR_FRESNEL + pow(fresnel, 3.0), 1.0);
        vec3 siliconeColor = diffuseColor.rgb * ambientOcclusion + totalSpecular;
        siliconeColor += (1.0 - textureMatcapMetallic * 2.0) * 0.05;

        /* 
          Alpha
        */        
        float fresnelAlpha = max(fresnel, 0.0);

        /* 
          Final
        */
        vec3 finalColor = mix(outgoingLight, fresnelColor, fresnelMask);
        finalColor = mix(finalColor, siliconeColor, step(roughnessFactor, 0.5));
        float finalAlpha = mix(1.0, fresnelAlpha, fresnelMask);

        gl_FragColor = vec4(finalColor, finalAlpha);
        // gl_FragColor = vec4(vTransformed, 1.0);
      `
        )
    }

    material.customProgramCacheKey = () => Math.random().toString()

    material.uniforms = uniforms

    return material
}

export function CoreMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.ShaderMaterial({
        uniforms: {
            uTime: new THREE.Uniform(0.0),

            COLOR_PURPLE: new THREE.Uniform(new THREE.Color(0xbec0fe)),

            tNoise: new THREE.Uniform(gl.assets.textures.noise),
        },
        vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec4 vViewPosition;
      varying vec3 vNormal;
      void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

        vUv = uv;
        vViewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;
      }
    `,
        fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec4 vViewPosition;
      varying vec3 vNormal;

      uniform float uTime;
      uniform vec3 COLOR_PURPLE;
      
      uniform sampler2D tNoise;

      void main() {
        float textureDistort = texture2D(tNoise, vUv * 4.0 + uTime * 0.1).r;
        float textureNoise = texture2D(tNoise, vUv + (textureDistort * 2.0 + 1.0) * 0.1 + uTime * 0.01).r;

        float fresnel = dot(normalize(-vViewPosition.xyz), normalize(vNormal));
        fresnel = 1.0 - pow(fresnel, 2.0);

        float final = smoothstep(0.35, 0.5, textureNoise);
        final -= smoothstep(0.5, 0.75, textureDistort) * 0.25;
        final += fresnel;
        final = min(final, 1.0);
        // final *= smoothstep(0.0, 0.5, textureNoise);
        // final = pow(final, 3.0);

        vec3 color = mix(COLOR_PURPLE, vec3(1.0), final);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    })

    return material
}

export function BloomMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.ShaderMaterial({
        // color: 0xffffff,
        transparent: true,
        // blendColor: THREE.MultiplyBlending,
        opacity: 0,
        depthTest: false,
        depthWrite: false,

        // side: THREE.BackSide,
        uniforms: {
            tAlpha: new THREE.Uniform(gl.assets.textures.bloom),

            uOpacity: new THREE.Uniform(0),
            uTime: new THREE.Uniform(0.0),
        },
        vertexShader: /* glsl */ `
      varying vec2 vUv;
      
      void main() {
        vUv = uv;

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform sampler2D tAlpha;

      uniform float opacity;
      uniform float uOpacity;
      uniform float uTime;

      void main() {
        float alpha = texture2D(tAlpha, vUv).r;

        float flicker = sin(sin(sin(uTime * 10.0) + uTime) - uTime) * 0.5 + 0.5;

        gl_FragColor = vec4(1.0, 1.0, 1.0, uOpacity * alpha - flicker * 0.025);
      }
    `,
    })

    return material
}

export function GoldMaterial(_params, _uniforms) {
    const material = new THREE.MeshPhysicalMaterial({
        //
        ..._params,
    })

    return material
}

export function TubeMaterial(_params, _uniforms) {
    const material = new THREE.ShaderMaterial({
        // side: THREE.DoubleSide,
        // color: 0xb2e0ff,
        // wireframe: true,
        transparent: true,
        // opacity: 0.5,
        uniforms: {
            uColor: new THREE.Uniform(new THREE.Color(0xb2e0ff)),
            uLineSize: new THREE.Uniform(0.0025),
            uBokeh: new THREE.Uniform(0.0),
        },
        vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,

        fragmentShader: /* glsl */ `
      varying vec2 vUv;

      uniform vec3 uColor;
      uniform float uLineSize;
      uniform float uBokeh;

      void main() {
        vec2 uv0 = vec2(vUv.x * 35.0, vUv.y * 22.5);

        /* 
          Color
        */
        float maskY = distance(fract(uv0.y), 0.5);
        maskY = 1.0 - smoothstep(0.0 + uLineSize, 0.0 + uLineSize + uBokeh, maskY);

        float maskX = distance(fract(uv0.x), 0.5);
        maskX = 1.0 - smoothstep(0.0 + uLineSize, 0.0 + uLineSize + uBokeh, maskX);

        float maskSkew = distance(fract(uv0.x + (uv0.y + 0.5)), 0.5);
        maskSkew = 1.0 - smoothstep(0.0 + uLineSize * 2.0, 0.0 + uLineSize * 2.0 + uBokeh * 2.0, maskSkew);

        float mask = min(maskY + maskX + maskSkew, 1.0);
        // mask += smoothstep(0.5, 0.5, fract(vUv.x * 40.0));
// 
        /* 
          Alpha
        */
        float alpha = smoothstep(0.7, 0.6, vUv.y) * 0.1 - uBokeh;

        vec4 diffuseColor = vec4(uColor, alpha * mask);

        gl_FragColor = diffuseColor;
      }
    `,
    })

    return material
}

export function TouchPadMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.ShaderMaterial({
        transparent: true,
        // opacity: 0,
        depthTest: false,
        uniforms: {
            uOpacity: new THREE.Uniform(0.0),
            uTime: new THREE.Uniform(0.0),
            uReveal: new THREE.Uniform(0.0),
            uMouseUv: new THREE.Uniform(new THREE.Vector2(0.0, 0.0)),
            uFrequency: new THREE.Uniform(1.0),

            tNoise: new THREE.Uniform(gl.assets.textures.noise),
            tMatcap: new THREE.Uniform(gl.assets.textures.matcap.glass),

            COLOR_BASE: new THREE.Uniform(new THREE.Color(0xb4dee7).convertLinearToSRGB()),
            COLOR_CORNERS: new THREE.Uniform(new THREE.Color(0x8bccda).convertLinearToSRGB()),
            COLOR_VISUALISER: new THREE.Uniform(new THREE.Color(0x60b2ff)),
        },
        vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec4 vViewPosition;

      void main() {
        vUv = uv;
        vViewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec4 vViewPosition;
      
      uniform sampler2D tNoise;
      uniform sampler2D tMatcap;

      uniform float opacity;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uReveal;
      uniform float uFrequency;
      uniform vec3 COLOR_BASE;
      uniform vec3 COLOR_CORNERS;
      uniform vec3 COLOR_VISUALISER;
      uniform vec2 uMouseUv;

      void main() {
        /* 
          UVs
        */
        vec2 uv0 = vUv * 2.0 - 1.0;

        /* 
          Matcap
        */
        vec3 viewDirection = normalize(vViewPosition.rgb);
        float fresnel = 1.0 - dot(normalize(-vViewPosition.xyz), normalize(vNormal));
        fresnel = pow(fresnel, 2.0);

        // vec3 x = normalize( vec3( viewDirection.z, 0.0, -viewDirection.x ) );
        // vec3 y = cross( viewDirection, x ); 
        // vec2 matcapUV = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5; 

        // float textureMatcapGlass = texture2D( tMatcap, matcapUV ).r;
        // textureMatcapGlass = smoothstep(0.5, 1.0, textureMatcapGlass);

        /* 
          Mouse Position
        */
        vec2 mousePosition = (uMouseUv * 2.0 - 1.0);

        /* 
          Distance from center
        */
        float dist = length(uv0);
        float visualiserDist = distance(uv0, vec2(0.0) + mousePosition * 0.33);

        /* 
          Reveal
        */
        float reveal = -0.5 + uReveal * 1.5;

        /* 
          Noise
        */
        float distortion = texture2D(tNoise, uv0 * (0.75 + (1.0 - dist) * 2.0) + uTime ).r * 2.0 - 1.0;
        float noise = texture2D(tNoise, vUv + uTime + distortion * 0.1).r;
        noise = smoothstep(0.5 - reveal - distortion * (1.0 - dist), 1.0 - reveal - distortion * (1.0 - dist), 1.0 - dist);

        /* 
          Base
        */
        float baseGradient = smoothstep(0.5, 1.0, dist);
        vec3 base = mix(COLOR_BASE, COLOR_CORNERS, baseGradient); 

        /* 
          Visualiser
        */
        float visualiserNoiseR = texture2D(tNoise, vUv * 0.33 + uTime * 0.33).r * 2.0 - 1.0;
        float visualiserNoiseG = texture2D(tNoise, vUv * 0.33 + uTime * 0.66).g * 2.0 - 1.0;
        float visualiserNoiseB = texture2D(tNoise, vUv * 0.33 + uTime * 1.0).b * 2.0 - 1.0;

        float visualiserR = visualiserDist + visualiserNoiseR * uFrequency;
        float visualiserG = visualiserDist + visualiserNoiseG * uFrequency;
        float visualiserB = visualiserDist + visualiserNoiseB * uFrequency;

        visualiserR = smoothstep(0.5, 1.0, visualiserR);
        visualiserG = smoothstep(0.5, 1.0, visualiserG);
        visualiserB = smoothstep(0.5, 1.0, visualiserB);

        vec3 visualiser = vec3(visualiserR, visualiserG, visualiserB);

        /* 
          Final
        */
        vec3 final = mix(base, COLOR_VISUALISER, visualiser);
        // final += smoothstep(0.75, 1.0, dist) * 0.25;

        /* 
          Alpha
        */
        // float alpha = length(uv0);
        // alpha = smoothstep(1.0, 0.8, alpha);
        // alpha = 1.0 - smoothstep(0.0, 0.5, alpha);

        gl_FragColor = vec4(final + fresnel * 0.5, noise * smoothstep(0.0, 0.5, uReveal) * smoothstep(1.0, 0.8 + min(1.0 - visualiserDist, 0.15), dist));
      }
    `,
    })

    return material
}

export function SiliconeMaterial(_params, _uniforms) {
    const gl = new Gl()

    const material = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
            tDiffuse: new THREE.Uniform(gl.assets.textures.earphoneSilicone),
            // tMatcap: new THREE.Uniform(gl.assets.textures.matcap.glass),

            COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff)),
        },
        vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec4 vViewPosition;
      varying float vLight;

      void main() {
        /* 
          Light
        */
        vLight = smoothstep(0.85, 1.0, dot(normalize(normalMatrix * normal), normalize(vec3(1.0, 1.0, 0.0))));

        vUv = uv;
        vViewPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalMatrix * normal;

        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec4 vViewPosition;
      varying float vLight;

      uniform sampler2D tDiffuse;
      // uniform sampler2D tMatcap;

      uniform float opacity;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uReveal;

      uniform vec3 COLOR_FRESNEL;

      void main() {
        /*
          UVs
        */
        vec2 uv0 = vUv * 2.0 - 1.0;

        /*
          Matcap
        */
        // vec3 viewDirection = normalize(vViewPosition.rgb);
        // float fresnel = 1.0 - dot(normalize(-vViewPosition.xyz), normalize(vNormal));
        // fresnel = pow(fresnel, 4.0);
        // fresnel *= float(gl_FrontFacing);

        // vec3 x = normalize( vec3( viewDirection.z, 0.0, -viewDirection.x ) );
        // vec3 y = cross( viewDirection, x );
        // vec2 matcapUV = vec2( dot( x, vNormal ), dot( y, vNormal ) ) * 0.495 + 0.5;

        /*
          Textires
        */
        // float textureMatcapGlass = texture2D( tMatcap, matcapUV ).r;
        // textureMatcapGlass = smoothstep(0.9, 1.0, textureMatcapGlass);

        vec3 textureDiffuse = texture2D(tDiffuse, vUv).rgb;

        gl_FragColor = vec4(textureDiffuse + vLight, 1.0);
      }
    `,
    })

    return material
}

// export function SiliconeMaterial(_params, _uniforms) {
//   const gl = new Gl()

//   const material = new THREE.MeshPhysicalMaterial({
//     //
//     ..._params,
//     transparent: true,
//     // side: THREE.DoubleSide,
//   })

//   /*
//     Uniforms
//   */
//   const uniforms = {
//     COLOR_FRESNEL: new THREE.Uniform(new THREE.Color(0x60b2ff)),
//   }

//   /*
//     Shader
//   */
//   material.onBeforeCompile = (_shader) => {
//     _shader.uniforms.COLOR_FRESNEL = uniforms.COLOR_FRESNEL

//     console.log(_shader.fragmentShader)

//     /*
//       Fragment
//     */
//     _shader.fragmentShader = _shader.fragmentShader.replace(
//       'varying vec3 vViewPosition;',
//       /* glsl */ `
//         varying vec3 vViewPosition;

//         uniform vec3 COLOR_FRESNEL;
//       `
//     )

//     _shader.fragmentShader = _shader.fragmentShader.replace(
//       '#include <dithering_fragment>',
//       /* glsl */ `
//         #include <dithering_fragment>

//         vec3 bottomDiffuse = diffuseColor.rgb + outgoingLight; // pow(diffuseColor.rgb * vec3(0.9, 1.0, 0.9), vec3(1.5)) + outgoingLight;

//         gl_FragColor = vec4(outgoingLight, 1.0 );
//       `
//     )
//   }

//   material.customProgramCacheKey = () => Math.random().toString()

//   material.uniforms = uniforms

//   return material
// }