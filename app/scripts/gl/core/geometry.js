import ArrayBuffer from 'nanogl/arraybuffer'
import IndexBuffer from 'nanogl/indexbuffer'

class Geometry {

  /**
   * Creates an instance of Geometry.
   *
   * @param {WebGLRenderingContext} gl
   * @param {Array} vertices
   * @param {Array} indices
   */
  constructor( gl, vertices, indices ) {

    this.gl = gl

    this.vertices = new Float32Array( vertices )
    if ( indices ) this.indices = new Uint16Array( indices )

    this.drawingBuffer = null
    this.drawingMethod = 'drawTriangles'

    this.allocate()

  }

  allocate(){

    var gl = this.gl

    this.buffer = new ArrayBuffer( gl )
    this.buffer.data( this.vertices )
    this.drawingBuffer = this.buffer

    if ( this.indices ) {
      this.ibuffer = new IndexBuffer( gl, gl.UNSIGNED_SHORT )
      this.ibuffer.data( this.indices )
      this.drawingBuffer = this.ibuffer
    }

  }

  bind( prg ) {

    var gl = this.gl

    this.buffer.attribPointer( prg );
    if ( this.indices ) this.ibuffer.bind()

  }

  attrib( attributeName, size, type ) {

    this.buffer.attrib( attributeName, size, type )

  }

  render() {

    this.drawingBuffer[ this.drawingMethod ]()

  }


}

module.exports = Geometry