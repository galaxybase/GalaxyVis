#extension GL_OES_standard_derivatives:enable
precision mediump float;

const float EPSILON=.000001;

varying vec4 u_color;
varying float u_strokeWidth;
varying vec4 u_strokeColor;
varying vec4 u_iconColor;

varying vec4 u_icon_isGradient_shape_opacity;
varying vec4 u_uv_texcoord;

uniform float background;
uniform sampler2D spriteAtlas;


void contentMain(in float u_iconType,in vec4 color,in vec4 vColors){
    gl_FragColor = vColors; 
}

bool isInRect(in vec2 coord,in float u_strokeWidth,in float r){
    float d=abs(r-u_strokeWidth);
    if(coord.x>=(1.-2.*d)/2.&&coord.x<=(1.+2.*d)/2.&&coord.y>=(1.-2.*d)/2.&&coord.y<=(1.+2.*d)/2.)
    return true;
    else
    return false;
}

float sdBox( in vec2 p, in vec2 b ){
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

float sdCircle( in vec2 p, in float r ){
    return length(p)-r;
}
// 三角形边距生成
float sdEquilateralTriangle(  in vec2 p ){
    const float k = 1.73205; //sqrt(3) 兼容低版本
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.5/k;
    if( p.x+k*p.y>0.0 ) p=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0, 0.0 );
    return -length(p)*sign(p.y);
}

float sdTriangleIsosceles( in vec2 p, in vec2 q ){
    p.x = abs(p.x);
	vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    float k = sign( q.y );
    float d = min(dot( a, a ),dot(b, b));
    float s = max( k*(p.x*q.y-p.y*q.x),k*(p.y-q.y)  );
	return sqrt(d)*sign(s);
}


float ndot(vec2 a, vec2 b ) { return a.x*b.x - a.y*b.y; }
// 棱形边距生成
float sdRhombus( in vec2 p, in vec2 b ) {
    vec2 q = abs(p);

    float h = clamp( (-2.0*ndot(q,b) + ndot(b,b) )/dot(b,b), -1.0, 1.0 );
    float d = length( q - 0.5*b*vec2(1.0-h,1.0+h) );
    d *= sign( q.x*b.y + q.y*b.x - b.x*b.y );
    
	return d;
}

void main(void){

    float u_iconType = u_icon_isGradient_shape_opacity.x;
    float u_isGradient = u_icon_isGradient_shape_opacity.y;
    float u_shapeType = u_icon_isGradient_shape_opacity.z;
    float opacity = u_icon_isGradient_shape_opacity.w;

    vec2 u_uv = u_uv_texcoord.xy;
    vec2 u_texcoord = u_uv_texcoord.zw;

    if(opacity == 0.0) {gl_FragColor = vec4(0.0); return;}
    float c = background;
    vec3 backgroundColor;
    backgroundColor.b=mod(c,256.);c=floor(c/256.);
    backgroundColor.g=mod(c,256.);c=floor(c/256.);
    backgroundColor.r=mod(c,256.);c=floor(c/256.);backgroundColor/=255.;
    
    // 是否使用渐变颜色和渐变方向
    int iG =  int(floor(u_isGradient + 0.5));
    float uGradient = iG == 1 ?
            length(u_texcoord-vec2(0.,1.)):
        iG == 2 ?
            length(u_texcoord-vec2(1.,0.)):
        iG == 3 ?
            length(u_texcoord-vec2(.5,0.)):
        iG == 4 ?
            length(u_texcoord-vec2(.5,1.)):
            1.;
    // 计算中心点距离
    float distance=distance(u_texcoord,vec2(.5));
    // 通过aa实现抗锯齿的效果
    // fwidth函数返回的是X和Y方向偏导数的绝对值的和
    float delta=fwidth(u_strokeWidth);
    float fwdis=fwidth(distance);
    // 外环标准值
    float benchmark = 0.5 - u_strokeWidth;
    vec4 color=texture2D(spriteAtlas,u_uv);
    vec4 vColors = mix(vec4(1.0),u_color,uGradient);
    vec4 InteriorColor;

    if(u_iconType<=1.5){
        if(color.a > 0.0)
            InteriorColor = color;
        else
            InteriorColor = vColors;
    }else if(u_iconType<=2.5){
        float alpha=smoothstep(0.,.9,color.a);
        InteriorColor = 
            mix( vColors,u_iconColor,alpha);
    }else{
        InteriorColor=vColors;
    }

    int shape = int(floor(u_shapeType + 0.5));

    vec4 stroke = mix( vec4(backgroundColor,1.0),u_strokeColor, opacity);

    vec4 outLine = mix(vec4(backgroundColor,1.0),vec4(1.0), opacity);
    // No 'switch'.  Switch statements not supported
    if(shape==1){
        
        vec4 col = InteriorColor;

        float d = sdCircle(vec2(.5)-u_texcoord,0.45);

        col = mix( vec4(backgroundColor,1.0),col, opacity);

        if(0.0 != u_strokeWidth){
            col = mix( col, outLine, 1.0-smoothstep(0.03 + u_strokeWidth, u_strokeWidth + 0.03 + fwdis,abs(d)) );
            col = mix( col, stroke, 1.0-smoothstep(u_strokeWidth,fwdis + u_strokeWidth,abs(d)) );
        }else{
            col = mix( col, vec4(vec3(col), 0.0), 1.0-smoothstep(0.0,fwdis,abs(d)) );
        }


        if(sign(d)>0.0)
            col = col - sign(d)*vec4(vec3(.0),1.0); 
        if(0.0 != u_strokeWidth)
            col = mix( col, stroke, 1.0-smoothstep(0.0,fwdis,abs(d)) );

        gl_FragColor = col;
    }else if(shape==2){
        vec4 col = InteriorColor;
        float d = sdBox(vec2(.5)-u_texcoord,vec2(0.45));
        col = mix( vec4(backgroundColor,1.0),col, opacity);
        if(0.0 != u_strokeWidth){
            col = mix( col, outLine, 1.0-smoothstep(0.03 + u_strokeWidth, u_strokeWidth + 0.03 + fwdis,abs(d)) );
            col = mix( col, stroke, 1.0-smoothstep(u_strokeWidth,fwdis + u_strokeWidth,abs(d)) );
        }else{
            col = mix( col, vec4(vec3(col), 0.0), 1.0-smoothstep(0.0,fwdis,abs(d)) );
        }

        if(sign(d)>0.0)
            col = col - sign(d)*vec4(vec3(.0),1.0); 
        if(0.0 != u_strokeWidth)
            col = mix( col, stroke, 1.0-smoothstep(0.0,fwdis+0.01,abs(d)) );

        gl_FragColor = col;
    }else if(shape==3){

        vec2 p = (u_texcoord-vec2(.5))*2.2;
        float d = sdEquilateralTriangle( p );

        vec4 col = InteriorColor;
        
        col = mix( col, outLine, 1.0-smoothstep(0.06 + u_strokeWidth, u_strokeWidth + 0.06 + fwdis,abs(d)) );

        col = mix( vec4(backgroundColor,1.0),col, opacity);
        if(sign(d)>0.0)
            col = col - sign(d)*vec4(vec3(.0),1.0);
        if(0.0 != u_strokeWidth){
            col = mix(col, stroke, 1.0-smoothstep(u_strokeWidth,fwdis + u_strokeWidth + 0.02, abs(d) ) );
            col = mix( col, stroke, 1.0-smoothstep(0.0,fwdis+0.02,abs(d)) );
        }

        gl_FragColor = col;
    }else if(shape==4){

        vec2 pa = (u_texcoord-vec2(.5)) * 1.2;
        vec2 ra = vec2(.5);
        float d = sdRhombus( pa, ra );

        vec4 col = InteriorColor; 

        col = mix( col, outLine, 1.0-smoothstep(0.03 + u_strokeWidth, u_strokeWidth + 0.03 + fwdis,abs(d)) );
        col = mix( vec4(backgroundColor,1.0),col, opacity);
        if(sign(d)>0.0)
            col = col - sign(d)*vec4(vec3(0.0),1.0);
        if(0.0 != u_strokeWidth){
            col = mix( col, stroke, 1.0-smoothstep(0.0,u_strokeWidth + fwdis,abs(d)) );    
            col = mix( col, stroke, 1.0-smoothstep(u_strokeWidth,  fwdis +u_strokeWidth,abs(d)) );
        }
        gl_FragColor = col;
    }
    
}