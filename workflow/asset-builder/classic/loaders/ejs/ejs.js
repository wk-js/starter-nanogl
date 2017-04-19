'use strict'

const fs       = require('fs')
const path     = require('path')
const Template = require('../../../../lib/template')
const Print    = wk.Print.new()

module.exports = function() {

  task('default', { async: true }, function( input, output ) {

    const Project       = this.argv.Project
    const AssetPipeline = this.argv.Project.AssetPipeline

    const INPUT  = path.join( AssetPipeline.LOAD_PATH, input )
    const OUTPUT = path.join( AssetPipeline.DST_PATH, output )

    const WATCHERS = []

    const scope = this

    const tmpl    = new Template(INPUT, OUTPUT)
    const EJSData = Project.getEJSData()
    tmpl.options = Object.assign({ filename: INPUT }, EJSData.options)
    tmpl.data    = Object.assign({}, EJSData.data)

    Object.assign(tmpl.data, require('./imports/asset')( Project, INPUT, OUTPUT ))

    function compile() {
      Print.debug( Print.magenta('['+scope._name+']'), Print.grey('compiled'), OUTPUT )
      tmpl.render()

      if (scope.argv.watch) {
        tmpl.includes.forEach(function(file) {
          watch(path.relative(process.cwd(), file))
        })
      }
    }

    function watch(file) {
      if (WATCHERS.indexOf(file) === -1) {
        Print.debug( Print.magenta('['+scope._name+']'), Print.grey('watching'), file )
        WATCHERS.push(file)
        fs.watchFile(file, { interval: 300 }, function(curr, prev) {
          if (curr.mtime > prev.mtime) compile()
        })
      }
    }

    if (this.argv.watch) {
      watch(INPUT)
    }

    setTimeout(compile, 1000)

  })

}