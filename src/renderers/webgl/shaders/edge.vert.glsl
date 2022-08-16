
attribute vec2 a_position;
attribute vec2 a_Uv;
attribute vec2 a_color;
attribute float a_sy;
attribute vec4 a_rotate;
attribute float a_arrow;

uniform mat4 aXformMatrix; 
uniform mat4 projection;

varying vec4 u_color;
varying vec2 u_fragCoord;
varying float u_arrow;
varying float opacity;

void main() {
    // 解压颜色
    float c = a_color.x;
    u_color.b = mod(c, 256.0); c = floor(c / 256.0);
    u_color.g = mod(c, 256.0); c = floor(c / 256.0);
    u_color.r = mod(c, 256.0); c = floor(c / 256.0); u_color /= 255.0;
    u_color.a = 1.0;

    mat4 transMat4 = mat4(
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        a_rotate.x,a_rotate.y,0,1
    );

    mat4 rotateMat4 = mat4(
        cos(a_rotate.z), sin(a_rotate.z),0,0,
        -sin(a_rotate.z), cos(a_rotate.z),0,0,
        0,0,1,0,
        0,0,0,1
    );

    float sy, sx;
    if(int(floor(a_arrow + 0.5)) == 0){
        // sy = a_sy + 0.01;
        // sx = a_rotate.w;
        sy = a_sy;
        sx = a_rotate.w;
    }else{
        // sy = (a_sy + 0.01) * 6.;
        // sx = a_rotate.w + 0.06;
        sy = a_sy *6.;
        sx = a_rotate.w;
    }

    mat4 scaleMat4 = mat4(
        sx,0,0,0,
        0,sy,0,0,
        0,0,0,0,
        0,0,0,1
    );

    mat4 aMat4 = transMat4 * rotateMat4 * scaleMat4;

    gl_Position = projection * aXformMatrix * aMat4 * vec4(a_position, 0.0,1.0);
   
    u_fragCoord = a_Uv;
    u_arrow = a_arrow;
    opacity = a_color.y;
 }