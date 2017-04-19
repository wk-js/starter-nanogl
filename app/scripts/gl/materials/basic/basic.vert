attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;

uniform mat4 uMVP;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vUv       = aUv;
  vNormal   = aNormal;
  vPosition = aPosition;

  gl_Position = uMVP * vec4( aPosition, 1.0 );
}