'use strict'

const path              = require('path')
const when              = require('when')
const CONSTS            = require('../../../constants')
const CLI               = CONSTS.WEBPACK_CLI
const SERVER_CLI        = CONSTS.WEBPACK_SERVER_CLI
const PACKAGE_JSON_PATH = CONSTS.PACKAGE_JSON_PATH

const buildPath = function(str) {
  return path.join(CONSTS.WEBPACK_CONFIG_PATH, str)
}

desc('[Webpack] Compile files')
task('default', { async: true }, function() {

  const CMD = []

  CMD.push(this.argv.server ? SERVER_CLI : CLI)
  CMD.push('--config')

  if (this.argv.compress) {
    CMD.push(buildPath('build.js'))
  } else {
    CMD.push(this.argv.watch ? buildPath('watch.js') : buildPath('compile.js'))
  }

  if (this.argv.hot) CMD.push('--hot --inline')

  wk.exec(CMD.join(' ')).then(this.complete).catch(this.fail)

})

desc( '[WEBPACK] Compile files per locale' )
task( 'build_locales', {async: true, visible: false}, function() {

  /**
   * Constants
   */

  const LocalesCfg      = require( PACKAGE_JSON_PATH ).localization || {}
  const LOCALES_ENABLED = LocalesCfg.available
  const env             = process.env.ENV || 'development'

  when.reduce( LOCALES_ENABLED, function( res, locale ) {

      return when.promise( function( resolve, reject ) {

        wk.Print.log( wk.Print.magenta( `[..] Start to build ${locale}`), env )

        const cmd = [
          `ENV=${env}`,
          `LOCALE=${locale}`,
          CLI,
          `--config ${buildPath("build.js")}`
        ]

        const ps = wk.createExec( cmd.join( ' ' ), {printStdout: false, printStderr: false} )

        ps.on( 'stderr', function(data) {
          console.log( data.toString('utf-8') )
        })

        ps.on( 'stdout', function(data) {
          console.log( data.toString('utf-8') )
        })

        ps.on( 'error', reject )
        ps.on( 'end', resolve )
        ps.execute()

      })
  }, []).then( function() {
    wk.Print.log( wk.Print.green( '[OK] Built with success') )
  })

})