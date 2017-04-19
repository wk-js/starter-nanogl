'use strict'

const path  = require('path')
const fs    = require('fs-extra')
const Print = wk.Print.new()

const STYLUS_CLI = path.join(path.dirname(require.resolve('stylus')), 'bin', 'stylus')

const applyExtname = function( output, extname ) {
  if (extname) {
    try {
      fs.renameSync(output, output+extname)
    } catch(e) {}
  }
}

module.exports = function() {

  task('default', { async: true }, function( input, output ) {

    const scope = this

    const AssetPipeline = this.argv.Project.AssetPipeline

    const INPUT = path.join( AssetPipeline.LOAD_PATH, input )
    let OUTPUT  = path.join( AssetPipeline.DST_PATH, output )
    let EXTNAME = path.extname(OUTPUT)

    // Fix stylus output extension name
    if (EXTNAME !== '.css') {
      OUTPUT = OUTPUT.replace(EXTNAME, '')
    } else {
      EXTNAME = null
    }

    const CMD = [STYLUS_CLI]

    if (this.argv.watch)      CMD.push('--watch')
    if (this.argv.compress)   CMD.push('--compress')
    if (this.argv.sourcemaps) CMD.push('--sourcemap-inline')

    CMD.push('--include-css')

    CMD.push('--use ./workflow/asset-builder/classic/loaders/stylus/imports/asset.js')

    CMD.push(INPUT)
    CMD.push('--out')
    CMD.push(OUTPUT)

    const ps = wk.createExec(CMD.join(' '), { printStdout: false, printStderr: false, stdio: 'pipe' })

    ps.on('stdout', function( data ) {
      Print.debug( Print.magenta('['+scope._name+']'), Print.clean(data) )
      applyExtname( OUTPUT, EXTNAME )
    })

    ps.on('stderr', function( data ) {
      Print.warn( Print.magenta('['+scope._name+']'), Print.clean(data) )
    })

    ps.on('error', this.fail)

    ps.on('exit', function() {
      applyExtname( OUTPUT, EXTNAME )
      this.complete()
    })

    ps.execute()

  })

}
