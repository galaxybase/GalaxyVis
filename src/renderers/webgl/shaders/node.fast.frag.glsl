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

void main(void) {
  if(opacity == 0.0) {gl_FragColor = vec4(0.0); return;}
  float c = background;
  vec3 backgroundColor;
  backgroundColor.b=mod(c,256.);c=floor(c/256.);
  backgroundColor.g=mod(c,256.);c=floor(c/256.);
  backgroundColor.r=mod(c,256.);c=floor(c/256.);backgroundColor/=255.;
  if (circle(u_texcoord, 1.0) < 0.5) {
    discard;
  }
  gl_FragColor = mix(vec4(backgroundColor,1.0),u_color, opacity);
}
