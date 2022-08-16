#extension GL_OES_standard_derivatives:enable
precision mediump float;
varying vec4 u_color;
varying vec2 u_fragCoord;
varying float u_arrow;
varying float opacity;

uniform float background;

float sdEquilateralTriangle(in vec2 p, in bool flag){

    if(((p.y < -0.3 && p.x <= 0.3 && p.x >= -0.3)) && !flag){
        return sign(p.y);
    }

    // const float k = 1.73205; //sqrt(3) 兼容低版本
    // p.x=abs(p.x)-1.;
    // p.y=p.y+1.5/k;
    // if(p.x+k*p.y>0.)
    //     p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.;
    // p.x-=clamp(p.x,-2.,0.);

    const float k = 1.73205; //sqrt(3) 兼容低版本
    p.x=abs(p.x)-1.;
    p.y=p.y+2./k;
    if(p.x+k*p.y>0.)
        p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.;
    p.x-=clamp(p.x,-3.,0.);

    return-length(p)*sign(p.y);
}

// float sdBox( in vec2 p, in vec2 b ){
//     vec2 d = abs(p)-b;
//     return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
// }

void main(){

    if(opacity == 0.0) { gl_FragColor = vec4(0.0); return;}
    
    float c = background;
    vec3 backgroundColor;
    backgroundColor.b=mod(c,256.);c=floor(c/256.);
    backgroundColor.g=mod(c,256.);c=floor(c/256.);
    backgroundColor.r=mod(c,256.);c=floor(c/256.);backgroundColor/=255.;

    int isArray = int(floor(u_arrow + 0.5));

    if(isArray == 0){

        // float d = sdBox(vec2(.5)-u_fragCoord,vec2(.5,.0));

        vec4 col = u_color;
        col = mix( vec4(backgroundColor,1.0),col, opacity);
        
        // vec4 outColor = col;

        // col = mix( vec4(vec3(1.0),0.0),col,1.0-smoothstep(0.1,.3,abs(d)) );

        // col = mix( vec4(0.27,0.74,.97,1.),col,1.0-smoothstep(0.2,.4,abs(d)) );

        gl_FragColor = col;
    }else{
        // 计算三角形的位置
        // float d=sdEquilateralTriangle((u_fragCoord - vec2(.5)) * 4.0, true);

        // float d2=sdEquilateralTriangle((u_fragCoord - vec2(.5,0.53)) * 3.0, false);

        float d=sdEquilateralTriangle(u_fragCoord - vec2(.5,.1), true) * 2.0;


        vec4 col;
        if(sign(d)<=0.0){
            col=u_color;
        }else{
            col=vec4(1.,1.,1.,0.);
        }
        // 边缘处理
        col=mix(col,u_color,1.-smoothstep(.001,.1,abs(d)));

        // col = mix(col, vec4(0.27,0.74,.97,1.), 1.0-smoothstep(0.001, .1,abs(d2)) );

        // if((col.r+col.g+col.b)!=3.){
        col = mix( vec4(backgroundColor,1.0),col, opacity);
        gl_FragColor=col;
        // }
        // else
        //     gl_FragColor=vec4(0.);
    }
}