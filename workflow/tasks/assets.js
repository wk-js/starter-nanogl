'use strict'

const Project       = require('../lib/project').getActive()
const AssetPipeline = require('../lib/asset-pipeline')

desc('[Asset] Generate asset key')
task('generate_key', function() {
  console.log(AssetPipeline.generateAssetKey())
})

desc('[Asset] Create or update manifest file')
task('resolve', function() {
  Project.configure()
})

desc('[Asset] Copy/symlink assets')
task('move', function() {
  if (!Project._configured) {
    Project.configure()
  }
  Project.AssetPipeline.proceedMove()
})