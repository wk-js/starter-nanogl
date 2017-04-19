'use strict'

module.exports = function(Project) {

  const AP = require('asset-pipeline')

  const AssetPipeline   = new AP
  Project.AssetPipeline = AssetPipeline

  Project.addHelpers({
    asset_url(p) {
      return AssetPipeline.getUrl( p )
    },

    asset_path(p) {
      return AssetPipeline.getPath( p )
    }
  })

}