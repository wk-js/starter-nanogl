'use strict'

const path   = require('path')
const CONSTS = require('../constants')
const Template = require('../lib/template')

module.exports = function( Project ) {

  const DATA = Project.data.package.localization

  const LOCALE            = process.env.LOCALE || DATA.default || 'en-GB'
  const LOCALES_AVAILABLE = DATA.available || [ 'en-GB' ]

  const LOCALE_DATA = require( path.join(CONSTS.LOCALES_PATH, LOCALE) )

  Project.addData('infos', {
    locale: LOCALE
  })

  Project.addData('localization', {
    locale: LOCALE,
    available: LOCALES_AVAILABLE,
    data: LOCALE_DATA
  })

  Project.addHelpers({
    t(pth, obj) {
      const keys = pth.split('.')
      let entry  = LOCALE_DATA
      keys.forEach((key)=>{
        if (entry !== undefined && entry !== null && entry[key] !== undefined && entry[key] !== null) {
          entry = entry[key]
        } else {
          entry = null
        }
      })

      if (!entry) return pth

      const variables = entry.match(/\$\{\w+\}/gi)

      if (variables) {
        obj = obj || {}

        variables.forEach(function(variable) {
          variable = variable.slice(2)
          variable = variable.slice(0, -1)
          obj[variable] = obj[variable] || ''
        })

        return Template.render(entry, {}, obj)
      }

      return entry
    }
  })

}