'use strict'

// const ejs  = require('ejs')
const Template = require('../../../lib/template')
const path = require('path')

const template = new Template()

module.exports = function( source ) {
  this.cacheable && this.cacheable()

  const query = {
    stringTest: /\.(js\.ejs)/,
    options: {},
    data: {}
  }

  // Object.assign does not make a deep clone...
  Object.assign(query.data, this.options['ejs'].data)
  Object.assign(query.options, this.options['ejs'].options)
  query.stringTest = this.options['ejs'].stringTest || query.stringTest

  query.options.filename = path.relative(process.cwd(), this.resourcePath)

  template.options     = query.options
  template.data        = query.data

  template.includes.forEach((pth) => {
    this.addDependency(pth)
  })

  const result = template.renderSource( source )

  if (this.resourcePath.match(query.stringTest)) {
    return result
  }

  return 'module.exports = ' + JSON.stringify(result)
}