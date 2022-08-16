attribute vec2 a_pos;
attribute vec2 a_texcoord;
attribute vec4 a_other;
attribute vec3 a_vertMat;
attribute vec3 a_vertMat2;
attribute vec3 a_fragMat;
attribute vec3 a_fragMat2;
attribute vec2 a_fontSize;

uniform float zoomLevel;

uniform mat4 aXformMatrix; 
uniform mat4 projection;

varying vec2 u_texcoord;
varying vec4 u_color;
varying vec4 u_bgColor;
varying float opacity;

void main() {
    // 解压颜色
    float c = a_other.x;
    u_color.b = mod(c, 256.0); c = floor(c / 256.0);
    u_color.g = mod(c, 256.0); c = floor(c / 256.0);
    u_color.r = mod(c, 256.0); c = floor(c / 256.0); u_color /= 255.0;
    // u_color.a = 0.0;
    // 解压背景色
    float bg = a_other.y;
    u_bgColor.b = mod(bg, 256.0); bg = floor(bg / 256.0);
    u_bgColor.g = mod(bg, 256.0); bg = floor(bg / 256.0);
    u_bgColor.r = mod(bg, 256.0); bg = floor(bg / 256.0); u_bgColor /= 255.0;
    u_bgColor.a = a_other.z;

    vec2 vPos;
    vPos.x = a_pos.x * a_vertMat.x + a_pos.y * a_vertMat.y + a_vertMat.z;
    vPos.y = a_pos.x * a_vertMat2.x + a_pos.y * a_vertMat2.y + a_vertMat2.z;

    vec2 vTex;
    vTex.x = a_texcoord.x * a_fragMat.x + a_texcoord.y * a_fragMat.y + a_fragMat.z;
    vTex.y = a_texcoord.x * a_fragMat2.x + a_texcoord.y * a_fragMat2.y + a_fragMat2.z;

    u_texcoord = vTex;

    gl_Position = projection * aXformMatrix *  vec4(vPos,0.0,1.0);

    opacity = a_other.w;

    if(a_fontSize.y >= ceil(zoomLevel * a_fontSize.x / 2. * 100.) / 100.){
        opacity = 0.0;
    }
}