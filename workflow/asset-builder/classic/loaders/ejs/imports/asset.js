'use strict'

const path = require('path')

module.exports = function(Project, input, output) {

  const AP = Project.AssetPipeline

  const baseDir = path.dirname(path.relative(AP.DST_PATH, output))

  return {
    asset_url: function(pth) {
      return AP.getUrl( pth, baseDir )
    },

    asset_path: function(pth) {
      return AP.getPath( pth, baseDir )
    }
  }

}