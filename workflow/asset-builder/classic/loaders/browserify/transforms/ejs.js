'use strict'

const through  = require('through')
const Template = require('../../../../../lib/template')

module.exports = function(file, options) {
  if (!file.match(/\.(ejs)$/)) return through()

  let buffer = ""

  return through(function write(chunk) {
    buffer += chunk.toString('utf8')
  }, function end() {
    const content = Template.render( buffer, Object.assign({ filename: file }, options.options), options.data )
    this.queue(content)
    this.queue(null)
  })
}