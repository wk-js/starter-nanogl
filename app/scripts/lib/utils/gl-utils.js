/**
 * Is high precision available on context
 *
 * @param {WebGLRenderingContext} gl
 * @return {Boolean}
 */
function isHighPAvailable( gl ) {

  var hv = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER, gl.HIGH_FLOAT )
  var hf = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, gl.HIGH_FLOAT )
  return  hf.precision > 0 && hv.precision > 0;

}

/**
 * Return a string to paste into a shader according to
 * precision available on the current webgl context
 *
 * @param {WebGLRenderingContext} gl
 * @return {String}
 */
function getPrecision( gl ) {

  return ( isHighPAvailable(gl) ) ? 'highp' : 'mediump'

}

export default {
  isHighPAvailable,
  getPrecision
}