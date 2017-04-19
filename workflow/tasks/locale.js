'use strict'

/**
 * Imports
 */
const path = require('path')
const join = path.join
const GS   = require('google-spreadsheet')
const fs   = require('fs-extra')


/**
 * Constants
 */
const CONST             = require('../constants')
const LOCALES_PATH      = CONST.LOCALES_PATH
const PACKAGE_JSON_PATH = CONST.PACKAGE_JSON_PATH
const NOOP              = CONST.NOOP

const LocalesCfg      = require( PACKAGE_JSON_PATH ).locales || {}
const LOCALES_ENABLED = LocalesCfg.enable
const SPREADSHEET_KEY = LocalesCfg.spreadsheet_key



/**
 * Create and clear locale path before imports
 */
task('preimport', { visible: false, async: true }, function() {
  fs.emptyDir(LOCALES_PATH, (err) => {
    if (err) return this.fail(err)
    this.complete()
  })
})


/**
 * Impots locales from the SPREADSHEET_KEY
 */
task('import', { visible: false }, function() {

  const sheet = new GS( SPREADSHEET_KEY )
  const DATA  = {}

  sheet.getRows( 1, function(err, row_data) {

    for (let i = 0, data = null, len = row_data.length; i < len; i++) {

      data = row_data[i]

      const category = data.category
      const key      = data.key

      // Fetch data
      LOCALES_ENABLED.forEach(function(locale) {
        if (data[locale.toLowerCase()] === '') return

        DATA[locale]                = DATA[locale] || {}
        DATA[locale][category]      = DATA[locale][category] || {}
        DATA[locale][category][key] = data[locale.toLowerCase()]
      })

    }

    // Generate file
    LOCALES_ENABLED.forEach(function(locale) {
      const ws = fs.createWriteStream( join( LOCALES_PATH, `${locale}.json` ) )
      ws.write( JSON.stringify(DATA[locale], null, 2) )
      ws.end()
    })

  })

})

desc('Import from Google Spreadsheet')
task('default', [ 'locale:preimport', 'locale:import' ])