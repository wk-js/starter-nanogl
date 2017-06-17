uniform vec3 uDiffuseColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

{{ require( '../../glsl/test_include.glsl' ) }}

void main() {
  gl_FragColor = vec4( test_include(uDiffuseColor), 1.0 );
}