'use strict'

const Project           = require('../../../lib/project').getConfiguredProject()
const webpack           = require('webpack')
const ExtractTextPlugin = require("extract-text-webpack-plugin")
const path              = require('path')

const EJS_LOADER    = path.join(process.cwd(), 'workflow/asset-builder/webpack/loaders/ejs-loader.js')
const STYLUS_ASSET_PLUGIN = path.join(process.cwd(), 'workflow/asset-builder/classic/loaders/stylus/imports/asset')

/**
 * Generate extract rules
 */
const AddExtractRules = function( config, ExtractPlugin ) {

  const entries = Object.keys(config.entry).map(function(key) {
    return path.join(config.context, config.entry[key])
  }).filter(function(entry) {
    return !entry.match(/\.(js)$/)
  })

  const MATCH_ENTRIES = function(regex) {
    return function( entry ) {
      return entry.match(regex) && entries.indexOf(entry) !== -1
    }
  }

  const rules = []

  config.module.rules.forEach(function(rule) {
    const exclude = entries.filter(function(entry) {
      return entry.match(rule.test)
    })

    if (rule.exclude) {
      rule.exclude = Array.isArray(rule.exclude) ? rule.exclude : [rule.exclude]
      rule.exclude = rule.exclude.concat(exclude)
    } else {
      rule.exclude = exclude
    }

    rules.push({
      test: MATCH_ENTRIES(rule.test),
      loader: ExtractPlugin.extract( rule.use ? rule.use.slice(0) : rule.loader )
    })
  })

  config.module.rules = config.module.rules.concat(rules)
}

/**
 * Exports a config function
 */
module.exports = function( options ) {

  const ABSOLUTE_SRC_PATH = Project.AssetPipeline.ABSOLUTE_LOAD_PATH
  const ABSOLUTE_DST_PATH = Project.AssetPipeline.ABSOLUTE_DST_PATH

  const ExtractPlugin = new ExtractTextPlugin("[name]")
  const EJSData = Project.getEJSData()

  const config = {}

  config.watch   = !!options.watch
  config.cache   = true
  config.context = path.join(process.cwd(), 'app')
  if (options.sourcemap) config.devtool = 'source-map'

  const entries = {}
  Object.keys(Project.entries).forEach(function(input) {
    entries[Project.entries[input]] = './'+input
  })

  config.entry = entries

  config.output = {
    path: ABSOLUTE_DST_PATH,
    filename: '[name]',
    chunkFilename: '[id]'
  }

  config.resolve = {
    extensions: [ '.js', '.js.ejs' ],
    alias: {
      "components":  ABSOLUTE_SRC_PATH + "/scripts/components",
      "consts":  ABSOLUTE_SRC_PATH + "/scripts/consts",
      "devices":  ABSOLUTE_SRC_PATH + "/scripts/devices",
      "lib":  ABSOLUTE_SRC_PATH + "/scripts/lib",
      "sections":  ABSOLUTE_SRC_PATH + "/scripts/sections",
      "vendor":  ABSOLUTE_SRC_PATH + "/scripts/vendor"
    }
  }

  config.module = {
    rules: [
      {
        test: /\.(ejs)$/,
        include: config.context,
        exclude: [ /\.(js\.ejs$)/ ],
        use: [EJS_LOADER]
      },
      {
        test: /\.(styl)$/,
        include: config.context,
        use: ['raw-loader', 'stylus-loader']
      },
      {
        test: /\.(html)$/,
        include: config.context,
        use: ['raw-loader']
      },
      {
        test: /\.(js)$/,
        include: config.context,
        use: ['babel-loader']
      },
      {
        test: /\.(js\.ejs)$/,
        include: config.context,
        use: ['babel-loader', EJS_LOADER]
      },
      {
        test: /\.(glsl|vert|frag)$/,
        include: config.context,
        use: [ EJS_LOADER ]
      }
    ]
  }

  config.stats = {
    colors: true,
    hash: false,
    version: true,
    timings: true,
    assets: false,
    chunks: false,
    chunkModules: false,
    modules: false,
    children: true,
    cached: false,
    reasons: false,
    source: false,
    errorDetails: false,
    chunkOrigins: false
    // context: '',
    // modulesSort: '',
    // chunksSort: '',
    // assetsSort: ''
  }

  config.plugins = [
    ExtractPlugin,

    new webpack.LoaderOptionsPlugin({
      options: {
        "ejs": {
          stringTest: /\.(js\.ejs)/,
          data: EJSData.data,
          options: EJSData.options
        },
        "stylus": {
          use: [ require(STYLUS_ASSET_PLUGIN)() ]
        },
        "babel": {
          presets: [ 'es2015' ],
          // plugins: [ 'transform-runtime' ],
          cacheDirectory: true
        }
      }
    })

  ]

  if (options.compress) {
    config.plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      })
    )
  }

  config.devServer = {
    contentBase: Project.AssetPipeline.ABSOLUTE_DST_PATH,
    host: "0.0.0.0",
    port: 3000,
    inline: true,
    watchContentBase: true,
    watchOptions: {
      poll: true
    }
  }

  AddExtractRules( config, ExtractPlugin )

  return config

}