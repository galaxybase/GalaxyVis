attribute vec2 a_pos;
attribute vec2 a_offset;
attribute vec2 a_color;
attribute float a_scale;
attribute vec2 a_uv;

uniform mat4 aXformMatrix;
uniform mat4 projection;

varying vec4 u_color;
varying vec2 u_texcoord;
varying float opacity;

void main(void){
    // 解压颜色
    float c=a_color.x;
    u_color.b=mod(c,256.);c=floor(c/256.);
    u_color.g=mod(c,256.);c=floor(c/256.);
    u_color.r=mod(c,256.);c=floor(c/256.);u_color/=255.;
    u_color.a = 1.0;
    float zoomResults = a_scale;

    vec4 nPos=vec4(a_pos.xy*zoomResults+a_offset,0.,1.);
    gl_Position=projection*aXformMatrix*nPos;
    u_texcoord=a_uv;
    opacity = a_color.y;
}