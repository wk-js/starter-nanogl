'use strict'

const NC       = require('lib/notification-center')
const Renderer = require('nanogl-renderer')
const Node     = require('nanogl-node')
const Camera   = require('nanogl-camera')

let TIME = 0

module.exports = Renderer({

  hdpi: false,
  // pixelRatio: window.devicePixelRatio,

  init() {
    this.resize = this.resize.bind(this)

    this.camera = Camera.makePerspectiveCamera()
    this.camera.lens.setAutoFov( 43.68 / 180 * Math.PI )
    this.camera.lens.aspect = this.width / this.height
    this.camera.lens.far    = 12000.

    this.root = new Node
    this.root.add( this.camera )

    window.addEventListener('resize', this.resize)
  },

  getContextOptions() {
    return {
      depth: true,
      stencil: true,
      alpha: true,
      antialias: false
    }
  },

  render( dt ) {
    TIME += dt

    NC.emit('pre-render', dt, TIME, this)

    this.root.updateWorldMatrix()
    this.camera.updateViewProjectionMatrix( this.width, this.height )

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 )
    this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT )
    this.gl.viewport(0, 0, this.width, this.height)

    NC.emit('render', dt, TIME, this)

  },

  resize() {
    this.canvas.width        = window.innerWidth
    this.canvas.height       = window.innerHeight
    this.canvas.style.width  = `${this.canvas.width}px`
    this.canvas.style.height = `${this.canvas.height}px`

    NC.emit('resize', this.canvas.width, this.canvas.height)
  }

})