'use strict'

module.exports = function() {

  const path    = require('path')
  const stylus  = require('stylus')
  const nodes   = stylus.nodes

  const Project = require('../../../../../lib/project').getActive(true)

  const AP = Project.AssetPipeline

  return function(styl) {

    const baseDir = path.dirname(path.relative(AP.DST_PATH, styl.options.dest))

    styl.define('asset_path', function( strObject ) {
      return new nodes.Literal('url("' + AP.getPath( strObject.string, baseDir ) + '")')
    })

    styl.define('asset_path_str', function( strObject ) {
      return new nodes.Literal(AP.getPath( strObject.string, baseDir ))
    })

    styl.define('asset_url', function( strObject ) {
      return new nodes.Literal('url("' + AP.getUrl( strObject.string, baseDir ) + '")')
    })

    styl.define('asset_url_str', function( strObject ) {
      return new nodes.Literal(AP.getUrl( strObject.string, baseDir ))
    })

  }

}