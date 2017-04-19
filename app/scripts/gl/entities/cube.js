'use strict'

import Node from 'nanogl-node'

import BasicMaterial from '../materials/basic/basic'
import BoxGeometry from '../geometries/box'

class Cube extends Node {

  constructor(gl) {
    super()

    this.gl = gl

    this.material = new BasicMaterial( this.gl, { diffuseColor: [ 1, 0, 0 ] } )
    this.geometry = new BoxGeometry( this.gl )
  }

  render( camera ) {
    this.material.prepare( this, camera )

    this.geometry.bind( this.material.prg )
    this.geometry.render()
  }

}

module.exports = Cube