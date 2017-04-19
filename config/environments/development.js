'use strict'

module.exports = function( Project ) {

  /**
   * Configure asset pipeline part
   */

  /**
   * Asset pipeline
   */
  const AssetPipeline = Project.AssetPipeline

  AssetPipeline.LOAD_PATH = './app'
  AssetPipeline.DST_PATH  = './public'
  AssetPipeline.cacheable = false

  // Keep the same file manifest.json and override it
  AssetPipeline.debug = false
  AssetPipeline.KEEP_MANIFEST_FILE = false
  AssetPipeline.ASSET_KEY = 'asteroids'

  /**
   * Configure build
   */

  /**
   * Entries
   */
  Project.entry('styles/index.styl', 'main.css')
  Project.entry('scripts/index.js', 'main.js')
  Project.entry('scripts/vendor/index.js', 'vendor.js')
  Project.entry('views/index.html.ejs', 'index.html')
}