attribute vec2 a_pos;
attribute vec2 a_offset;
attribute float a_type;
attribute vec4 a_data;
attribute vec2 a_uv;
attribute vec3 a_uvdata;
attribute vec4 v_color;

uniform mat4 aXformMatrix;
uniform mat4 projection;
uniform float atlas;

varying vec4 u_color;
varying vec4 u_strokeColor;
varying float u_strokeWidth;
varying vec4 u_iconColor;
varying vec4 u_icon_isGradient_shape_opacity;
varying vec4 u_uv_texcoord;

const float bias = 255.0 / 254.0;

void main(void){
    // 解压颜色
    u_color = v_color;
    u_color.a *= bias;
    
    float w=a_data.w;
    u_iconColor.b=mod(w,256.);w=floor(w/256.);
    u_iconColor.g=mod(w,256.);w=floor(w/256.);
    u_iconColor.r=mod(w,256.);w=floor(w/256.);u_iconColor/=255.;
    u_iconColor.a = 1.0;

    float h=a_data.z;
    u_strokeColor.b=mod(h,256.);h=floor(h/256.);
    u_strokeColor.g=mod(h,256.);h=floor(h/256.);
    u_strokeColor.r=mod(h,256.);h=floor(h/256.);u_strokeColor/=255.;
    u_strokeColor.a = 1.0;
    
    float typeNumber = a_type;
    float graType = mod(typeNumber,256.);typeNumber=floor(typeNumber/256.);
    float iconType = mod(typeNumber,256.);typeNumber=floor(typeNumber/256.);
    float shapeType = mod(typeNumber,256.);typeNumber=floor(typeNumber/256.);

    float zoomResults=a_data.y;
    
    vec2 uvOffset=vec2(a_uvdata.x,a_uvdata.y);

    vec4 nPos=vec4(a_pos.xy*zoomResults+a_offset.xy,0.0,1.);
    gl_Position=projection*aXformMatrix*nPos;
    u_strokeWidth=a_data.x;

    u_icon_isGradient_shape_opacity = vec4(iconType, graType, shapeType, a_uvdata.z );
    u_uv_texcoord = vec4(a_uv*atlas+uvOffset, a_uv);
}