'use strict'

module.exports = function(Project) {

  // Update output paths
  const INPUTS = Object.keys(Project.entries)
  INPUTS.forEach(function(input) {
    Project.entries[input] = Project.AssetPipeline.getPath(input).replace(/^\//, '')
  })

}