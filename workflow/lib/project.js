'use strict'

const guid   = require('./utils/guid').guid
const CONSTS = require('../constants')

const PackageJSON = require(CONSTS.PACKAGE_JSON_PATH)

let ACTIVE     = null
const PROJECTS = {}

class Project {

  constructor(auto_configure) {

    this.guid    = guid()
    this.helpers = {}
    this.data    = {
      global: {},
      infos: {},
      package: PackageJSON
    }

    this.entries = {}

    this.options = {
      EJS: {}
    }

    this._configured = false

    PROJECTS[this.guid] = this

    if (auto_configure) this.configure()
  }

  new() {
    return new Project
  }

  entry(input, output, options) {
    this.entries[input] = output
    this.AssetPipeline.add(input, Object.assign({ rename: output, keepPath: false }, options))
  }

  addHelpers( obj ) {
    Object.assign(this.helpers, obj)
  }

  addData( key, obj ) {
    const data = this.data[key] || {}
    this.data[key] = Object.assign(data, obj)
  }

  configure() {
    if (this._configured) return

    require('../modules/asset-pipeline')(this)
    // require('../modules/locales')(this)
    require('../modules/environment')(this)
    this.AssetPipeline.resolve()
    require('../modules/asset-pipeline-entries')(this)

    this._configured = true
  }

  getEJSData() {
    const data = {}
    Object.assign(data, this.data)
    Object.assign(data, this.helpers)

    const options = Object.assign({}, this.options.EJS)

    return { data: data, options: options }
  }

}

Project.getActive = function(auto_configure) {
  if (!ACTIVE) {
    ACTIVE = new Project(auto_configure)
  }

  return ACTIVE
}

Project.getConfiguredProject = function() {
  return Project.getActive(true)
}

Project.getByGUID = function(guid) {
  return PROJECTS[guid]
}

module.exports = Project