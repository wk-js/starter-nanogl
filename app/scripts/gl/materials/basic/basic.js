import { vec3, mat4 } from 'gl-matrix'
import Texture from 'nanogl/texture'
import Program from 'nanogl/program'
import GLUtils from 'lib/utils/gl-utils'

var M4 = mat4.create();

class BasicMaterial {

  /**
   * @param {Object} opts =>
   *   @param {Number} diffuseColor
   *   @param {Texture} diffuseMap
   *   @paran {Number} diffuseMapScale
   *
   */
  constructor( gl, opts = {} ) {
    opts = Object.assign({
      prg: null,
      diffuseColor: vec3.fromValues( 1, 1, 1 ),
    }, opts || {})

    this.gl   = gl
    this.defs = 'precision ' + GLUtils.getPrecision(gl) + ' float;\n'
    this.prg  = opts.prg

    this.diffuseColor = opts.diffuseColor

    if ( !this.prg )  this.compileProgram()
    this.setUniforms()
  }

  compileProgram() {

    this.prg = new Program( this.gl )
    this.prg.compile(
      require('./basic.vert'),
      require('./basic.frag'),
      this.defs
    )

  }

  setUniforms(){
    this.prg.use()
    this.prg.uDiffuseColor( this.diffuseColor )
  }

  prepare( node, camera ) {

    this.prg.use()

    camera.modelViewProjectionMatrix( M4, node._wmatrix )
    this.prg.uMVP( M4 )

  }

}

export default BasicMaterial