#extension GL_OES_standard_derivatives:enable
precision mediump float;

const float PI = 3.14159265358979323846;
const float TAU = 6.28318530717958647692;
const float ANGLE_OFFSET = -PI*0.5;

varying vec4 u_color;
varying vec2 u_texcoord;
varying float opacity;
// varying float u_width;
varying float u_progress;

uniform float background;

const float radius = 0.5;

float sdCircle( in vec2 p, in float r ){
    return length(p)-r;
}

void main(void) {
    if(opacity == 0.0) {gl_FragColor = vec4(0.0); return;}
    float bg = background;
    vec4 backgroundColor;
    backgroundColor.b=mod(bg,256.);bg=floor(bg/256.);
    backgroundColor.g=mod(bg,256.);bg=floor(bg/256.);
    backgroundColor.r=mod(bg,256.);bg=floor(bg/256.);backgroundColor/=255.;
    backgroundColor.a = 1.;

    float innerRadius = 0.5;
    float outerRadius = 0.98;
    float startAngle = 0.0;
    float endAngle = u_progress * TAU;

    vec2 uv = (u_texcoord - vec2(0.5)) * 2.0;
    float d = length( uv );
    vec4 ioColor = u_color; 

    float w = fwidth( d ) * 1.0;
    float c = smoothstep( outerRadius + w, outerRadius - w, d );
    c -= smoothstep( innerRadius + w, innerRadius - w, d );
    
    gl_FragColor = vec4(ioColor.rgb * vec3(c), 1.0);

    float dis = sdCircle(vec2(.5)-u_texcoord,0.5 * outerRadius);
    // 计算中心点距离
    float distance=distance(u_texcoord,vec2(.5));
    float fwdis=fwidth(distance);
    vec4 col = gl_FragColor;
    col = mix(col, backgroundColor, 1.0-smoothstep(0.0, fwdis, abs(dis)));

    col = mix(backgroundColor,col, opacity);
    if(sign(dis)>0.0)
        col = col - sign(dis)*vec4(vec3(.0),1.0);
    col = mix( col, backgroundColor, 1.0-smoothstep(0.0, fwdis, abs(dis)) );
    gl_FragColor = col;

    if(u_progress != 1.0){
        float angle = (atan(-uv.y,uv.x)) + PI/2.;
        if( angle < 0.0 ) angle += TAU;

        if( angle >= endAngle){      
            float a = smoothstep( 0.0, -w*2.0,  abs(endAngle + angle) );  
            gl_FragColor *= a;
        }
        // if(angle - w*2.0 < startAngle ){
        //     float a = smoothstep(  -w*2.0, w*2.0, (abs(startAngle - angle)) );
        //     gl_FragColor *= a;    
        // }

        // float lineWidth = (outerRadius - innerRadius) * 0.5;
        // float midRadius = innerRadius + lineWidth;
        
        // vec2 endAnglePos = vec2( cos(endAngle-ANGLE_OFFSET), sin(endAngle-ANGLE_OFFSET)) * vec2(midRadius);
        // float dist = length( uv - endAnglePos );
        // float buttAlpha = smoothstep( lineWidth + w, lineWidth - w, dist );
        // gl_FragColor = mix(gl_FragColor, ioColor, buttAlpha );

        // vec2 startAnglePos = vec2( cos(startAngle-ANGLE_OFFSET), sin(startAngle-ANGLE_OFFSET)) * vec2(midRadius);
        // dist = length( uv - startAnglePos );
        // buttAlpha = smoothstep( lineWidth + w, lineWidth - w, dist );
        // gl_FragColor = mix(gl_FragColor, ioColor, buttAlpha );
    }

}
