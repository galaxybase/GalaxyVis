#extension GL_OES_standard_derivatives:enable
#define SDF_PX 8.0
#define DEVICE_PIXEL_RATIO 2.0
#define EDGE_GAMMA 0.105 / DEVICE_PIXEL_RATIO

precision mediump float;

uniform sampler2D u_texture;
uniform float u_gamma;
uniform vec2 u_texsize;
uniform float background;

varying vec2 u_texcoord;
varying vec4 u_color;
varying vec4 u_bgColor;
varying float opacity;

vec4 AntiAliasPointSampleTexture_Linear(vec2 uv, vec2 texsize) {      
    vec2 w=fwidth(uv);  
    return texture2D(u_texture, (floor(uv)+0.5+clamp((fract(uv)-0.5+w)/w,0.,1.)) / texsize, -99999.0);    
}  

vec4 AntiAliasPointSampleTexture_ModifiedFractal(vec2 uv, vec2 texsize) {     
    uv.xy -= 0.5;  
    vec2 w=fwidth(uv);  
    return texture2D(u_texture, (floor(uv)+0.5+min(fract(uv)/min(w,1.0),1.0)) / texsize, -99999.0);  
} 

void main(){

    if(opacity == 0.0) {gl_FragColor = vec4(0.0); return;}

    float c = background;
    vec4 backgroundColor;
    backgroundColor.b=mod(c,256.);c=floor(c/256.);
    backgroundColor.g=mod(c,256.);c=floor(c/256.);
    backgroundColor.r=mod(c,256.);c=floor(c/256.);backgroundColor/=255.;
    backgroundColor.a = 1.;
    float u_buffer=.76;

    vec4 new2D = AntiAliasPointSampleTexture_ModifiedFractal(u_texcoord,u_texsize);

    float dist=new2D.r;
    float gamma = (u_gamma * 1.19 / SDF_PX + EDGE_GAMMA) ;
    float alpha=
        smoothstep(u_buffer-gamma,u_buffer+gamma,dist);
    if(u_bgColor.a>0.){
        vec4 realBColor = mix(u_bgColor, u_color, alpha);
        gl_FragColor = mix( backgroundColor, realBColor, opacity );
    }
    else{
        vec4 RealvColor = mix( backgroundColor, u_color, opacity );
        gl_FragColor= vec4(RealvColor.rgb,alpha);
    }
}