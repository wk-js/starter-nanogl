'use strict'

const crypto   = require('crypto')
const stream   = require('stream')
const Writable = stream.Writable
const memStore = {}

function MemoryStream(key, options) {
  Writable.prototype.constructor.call(this, options)

  this.key = MemoryStream.md5(key)
  memStore[this.key] = new Buffer('')
}

MemoryStream.prototype = Object.create(Writable.prototype)
MemoryStream.prototype.constructor = MemoryStream

MemoryStream.prototype._write = function(chunk, enc, cb) {
  var bf = Buffer.isBuffer(chunk) ? chunk : new Buffer(chunk)
  memStore[this.key] = Buffer.concat([memStore[this.key], bf])
  cb()
}

MemoryStream.prototype.getData = function(encoding) {
  if (!memStore[this.key]) return null
  const value = encoding ? memStore[this.key].toString(encoding) : memStore[this.key]
  this.clean()
  return value
}

MemoryStream.prototype.clean = function() {
  delete memStore[this.key]
}

MemoryStream.md5 = function( str ) {
  str = str || Math.random()
  return crypto.createHash('md5').update(str+'?'+Date.now()).digest('hex')
}

module.exports = MemoryStream