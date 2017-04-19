'use strict'

const Renderer = require('./gl/core/renderer')
const Scene    = require('./gl/core/scene')

const renderer = new Renderer( document.querySelector('canvas') )
renderer.play()
renderer.updateSize()

const scene = new Scene( renderer )
scene.activate()