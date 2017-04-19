'use strict'

import Node from 'nanogl-node'
import Cube from '../entities/cube'
import NC from 'lib/notification-center'

class Scene extends Node {

  constructor( renderer ) {
    super()

    this._onPreRender = this._onPreRender.bind(this)
    this._onRender    = this._onRender.bind(this)

    this.renderer = renderer
    this.renderer.root.add( this )

    this.cube = new Cube( this.renderer.gl )
    this.cube.z = -5
    this.add( this.cube )
  }

  get camera() {
    return this.renderer.camera
  }

  activate() {
    NC.on('pre-render', this._onPreRender)
    NC.on('render', this._onRender)
  }

  desactivate() {
    NC.off('pre-render', this._onPreRender)
    NC.off('render', this._onRender)
  }

  _onPreRender(dt) {
    this.cube.rotateY(dt * 0.5)
    this.cube.rotateX(dt)
  }

  _onRender() {
    this.cube.render( this.camera )
  }

}

module.exports = Scene