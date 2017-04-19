'use strict'

const through  = require('through')

module.exports = function(file, options) {
  options = options || {}
  options.extensions = options.extensions || [ 'txt' ]

  const regex = new RegExp('\.(' + options.extensions.join('|') + ')', 'gi')
  if (!file.match(regex)) return through()

  let buffer = ""

  return through(function write(chunk) {
    buffer += chunk.toString('utf8')
  }, function end() {
    this.queue('module.exports = (' + JSON.stringify(buffer) + ')')
    this.queue(null)
  })
}