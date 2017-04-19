'use strict'

const path         = require('path')
const fs           = require('fs-extra')
const ejs          = require('lodash.template')
const EventEmitter = require('events').EventEmitter

class Template extends EventEmitter {


  /**
   * Create a new template
   *
   * @param {String} input - Path the input file
   * @param {String} ouput - Path the output file
   */
  constructor(input, output) {
    super()

    this.include = this.include.bind(this)
    this.require = this.require.bind(this)

    this.input   = input
    this.output  = output

    this.options  = {}
    this.data     = {}
    this.ejs      = ejs
    this.includes = []

    this.enableWatch = false
  }

  /**
   * Render
   */
  render() {

    if (!this.options.filename) {
      this.options.filename = path.resolve(this.input)
    }

    this.emit('start')

    fs.ensureDirSync( path.dirname(this.output) )

    const rs = fs.createReadStream(this.input)
    const ws = fs.createWriteStream(this.output)

    rs.on('data', ( chunk ) => {
      chunk = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk
      ws.write( this.renderSource(chunk) )
    })

    rs.on('end', () => {
      ws.end()

      this.emit('end')
    })

  }

  include(pth) {
    pth = path.resolve(path.dirname(this.options.filename), pth)
    pth = path.relative(process.cwd(), pth)
    var src = fs.readFileSync(pth)
    if (this.includes.indexOf(pth) === -1) {
      this.includes.push(pth)
      // if (this.enableWatch) this.watch(pth, this.options.filename)
    }
    return this.renderSource(src)
  }

  require(pth) {
    pth = path.resolve(path.dirname(this.options.filename), pth)
    return require(pth)
  }

  watch(child, parent) {
    fs.watchFile(child, { interval: 300 }, (curr, prev) => {
      if (curr.mtime > prev.mtime) {
        fs.open(parent, 0, function(err, fd) {
          if (err) return console.log(err)

          fs.fstat(fd, function(err) {
            if (err) return console.log(err)
            var now = Date.now()

            var a = parseInt(now / 1000, 10)
              , m = parseInt(now / 1000, 10)

            fs.futimes(fd, a, m, function(err) {
              if (err) return console.log(err)
              fs.close(fd)
            })
          })
        })
      }
    })
  }

  /**
   * Render a source
   *
   * @param {String} src
   */
  renderSource( src ) {
    // Force defaults
    this.data.include = this.include
    this.data.require = this.require
    this.options.interpolate = /<%=([\s\S]+?)%>/g

    return Template.render( src, this.options, this.data )
  }

}

/**
 * Render
 *
 * @param {String} src
 * @param {Object} options
 * @param {Object} data
 */
Template.render = function(src, options, data) {
  return ejs(src, options)(data)
}

module.exports = Template