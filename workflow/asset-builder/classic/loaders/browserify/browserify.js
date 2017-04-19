'use strict'

const fs         = require('fs-extra')
const path       = require('path')
const browserify = require('browserify')
const watchify   = require('watchify')
const Print      = wk.Print.new()

// Transforms
const ejs_transform = require('./transforms/ejs')
const raw_transform = require('./transforms/raw')

module.exports = function() {

  task('default', function( input, output ) {

    const AssetPipeline = this.argv.Project.AssetPipeline

    input  = path.join( AssetPipeline.LOAD_PATH, input )
    output = path.join( AssetPipeline.DST_PATH, output )

    const browserify_options = {}
    const tmp_output = path.join( process.cwd(), 'tmp', path.basename(output) )
    const name = this._name

    // Functions
    const bundle = function() {
      var bndle = b.bundle();
      bndle     = bndle.on('error', onError);

      if (tmp_output) {
        bndle.pipe(fs.createWriteStream(tmp_output));
      } else {
        bndle.pipe(process.stdout);
      }
    }

    const onLabel = function(e) {
      const i = input.replace('./', '');
      if (e.match(i)) {
        fs.move(tmp_output, output, { clobber: true }, function() {
          Print.debug(
            Print.magenta(`[${name}]`),
            Print.gray('compiled'),
            output
          )
        })
      }
    }

    const onError = function(err) {
      Print.error(`[${name}] Error`)
      Print.error(err)
    }

    const onLog = function(msg) {
      Print.verbose(`[${name}] [Wachify] ${msg}`)
    }

    const onUpdate = bundle

    // Force create a new cache
    if (browserify_options.cache) {
      browserify_options.cache = {}
      browserify_options.packageCache = {}
    }

    // Configure Browserify
    var b  = browserify(input, browserify_options)
    b.on('label', onLabel)

    // Configure Watchify
    if (this.argv.watch) {
      b = watchify(b)
      b.on('update', onUpdate)
      b.on('log', onLog)
    }

    // Transforms
    const EJS   = this.argv.Project.getEJSData()

    b.transform(ejs_transform, EJS)
    b.transform(raw_transform, { extensions: [ 'html' ] })
    b.transform("babelify", { presets: [ "es2015" ] })

    // Start
    bundle()

  })

}