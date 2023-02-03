#extension GL_OES_standard_derivatives:enable
precision mediump float;

varying vec4 u_color;
varying vec2 u_texcoord;
varying float opacity;

uniform float background;

const float radius = 0.5;

float circle(in vec2 st, in float radius) {
  vec2 dist = st - vec2(0.5);
  return 1.0 - smoothstep(
      radius - (radius * 0.01),
      radius +(radius * 0.01),
      dot(dist, dist) * 4.0);
}

float sdCircle( in vec2 p, in float r ){
    return length(p)-r;
}

void main(void) {
  if(opacity == 0.0) {gl_FragColor = vec4(0.0); return;}
  float c = background;
  vec4 backgroundColor;
  backgroundColor.b=mod(c,256.);c=floor(c/256.);
  backgroundColor.g=mod(c,256.);c=floor(c/256.);
  backgroundColor.r=mod(c,256.);c=floor(c/256.);backgroundColor/=255.;
  backgroundColor.a = 1.;
  float d = sdCircle(vec2(.5)-u_texcoord,0.45);
  // 计算中心点距离
  float distance=distance(u_texcoord,vec2(.5));
  float fwdis=fwidth(distance);
  vec4 col = u_color;
  col = mix(col, backgroundColor, 1.0-smoothstep(0.0, fwdis, abs(d)));

  col = mix(backgroundColor,col, opacity);
  if(sign(d)>0.0)
    col = col - sign(d)*vec4(vec3(.0),1.0);
  col = mix( col, backgroundColor, 1.0-smoothstep(0.0, fwdis, abs(d)) );
  gl_FragColor = col;
}
