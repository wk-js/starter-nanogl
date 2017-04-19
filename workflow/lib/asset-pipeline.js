'use strict'

const crypto    = require('crypto')
const fs        = require('fs-extra')
const minimatch = require('minimatch')
const url       = require('url')
const FileList  = require('filelist').FileList
const guid      = require('./utils/guid').guid

const path      = require('path')
const join      = path.join
const relative  = path.relative

/**
 * Cache-break path
 */
const _cacheBreak = function(pth, ASSET_KEY) {
  const extname  = path.extname(pth)
  const basename = path.basename(pth, extname)
  const dirname  = path.dirname(pth)
  const hash     = AssetPipeline.md5(pth+ASSET_KEY)
  return join( dirname, `${basename}-${hash}${extname}` )
}

/**
 * Clean path
 */
const _cleanPath = function( input ) {
  const i = input.split('/')
  i.push('')
  input = path.normalize(i.join('/')).slice(0, -1)
  return input
}

class AssetPipeline {

  constructor( parameters ) {
    this._deleteManifest = this._deleteManifest.bind(this)

    this.ASSET_KEY = process.env.ASSET_KEY || AssetPipeline.generateAssetKey()

    this.PENDING = {
      OPTIONS: {},
      LIST: new FileList,
      MOVE: []
    }

    this.CACHE = null

    this.CWD        = process.cwd()
    this.LOAD_PATH  = './app'
    this.DST_PATH   = './public'
    this.ASSET_HOST = null
    this.KEEP_MANIFEST_FILE = true

    this.cacheable = false
    this.debug = false

    this.setParameters( parameters )

  }

  get ABSOLUTE_LOAD_PATH() {
    return join(this.CWD, this.LOAD_PATH)
  }

  get ABSOLUTE_DST_PATH() {
    return join(this.CWD, this.DST_PATH)
  }


  /**
   * Override parameters
   *
   * Valid parameters: 'LOAD_PATH', 'DST_PATH', 'CWD', 'cacheable', 'ASSET_HOST'
   *
   * @param {Object} parameters
   *
   * @memberOf AssetPipeline
   */
  setParameters( parameters ) {
    parameters     = parameters || {}

    const validParams = [
      'LOAD_PATH', 'DST_PATH', 'CWD', 'cacheable', 'ASSET_HOST'
    ]

    for (const key of validParams) {
      if (this.hasOwnProperty(key) && parameters.hasOwnProperty(key)) {
        this[key] = parameters[key]
      }
    }
  }


  /**
   * Return the asset path. Relative to the baseDir if precised
   *
   * @param {String} pth
   * @param {String} baseDir
   * @returns {String}
   *
   * @memberOf AssetPipeline
   */
  getPath( pth, baseDir ) {
    if (this.CACHE[pth]) {
      pth = this.CACHE[pth].cache || this.CACHE[pth].output
    }

    if (baseDir) {
      const from = join(this.ABSOLUTE_DST_PATH, baseDir)
      const to   = join(this.ABSOLUTE_DST_PATH, pth)
      pth        = path.relative( from, to )
    }

    // make it always absolute
    return _cleanPath( '/' + pth )
  }


  /**
   * Return the asset path. Relative to the baseDir if precised.
   *
   * If "ASSET_HOST" is setted, return an asset url
   *
   * @param {String} pth
   * @param {String} baseDir
   * @returns {String}
   *
   * @memberOf AssetPipeline
   */
  getUrl( pth, baseDir ) {
    pth = this.getPath( pth, baseDir )

    if (this.ASSET_HOST) {
      pth = path.relative(this.ABSOLUTE_DST_PATH, join(this.ABSOLUTE_DST_PATH, baseDir || '', pth))
      pth = url.resolve( this.ASSET_HOST, pth )
    }

    return pth
  }


  /**
   * Return helpers
   *
   * @returns {Object}
   *
   * @memberOf AssetPipeline
   */
  getHelpers() {
    return {
      asset_path: this.getPath.bind(this),
      asset_url: this.getUrl.bind(this)
    }
  }


  getManifestPath() {
    if (this.debug) {
      return path.join(process.cwd(), 'tmp', `manifest.json`)
    }
    return path.join(process.cwd(), 'tmp', `manifest-${this.ASSET_KEY}.json`)
  }


  /**
   * Add a file/path to pending list
   *
   * @param {String} input
   * @param {Object} options
   * @param {String} options.baseDir
   * @param {String} options.rename
   * @param {Boolean} options.cache
   * @param {Boolean} options.share
   * @param {Boolean} options.keepPath
   *
   * @memberOf AssetPipeline
   */
  add( input, options ) {

    options = Object.assign({ is_file: true }, options || {})

    const is_directory = !path.extname(input)

    // Clean input
    input = _cleanPath( input )

    // Add all directories
    if (is_directory) {
      this.PENDING.LIST.include( join(this.ABSOLUTE_LOAD_PATH, input) )
      options.is_file = false
      this.PENDING.OPTIONS[ input ] = options
      input   = join(input, '**')
      options = {
        baseDir: '',
        cache: false,
        share: true,
        keepPath: true,
        rename: undefined
      } // Override options for file/dirs children
    }

    // Add to pending
    this.PENDING.LIST.include( join(this.ABSOLUTE_LOAD_PATH, input) )
    this.PENDING.OPTIONS[ input ] = options
  }


  /**
   * Exclude file/path from pending list
   *
   * @param {String} input
   *
   * @memberOf AssetPipeline
   */
  remove( input ) {
    if (this.PENDING.OPTIONS[ input ]) delete this.PENDING.OPTIONS[ input ]
    this.PENDING.LIST.exclude( join(this.ABSOLUTE_LOAD_PATH, input) )
  }


  /**
   * Add a file for a symlink
   *
   * @param {String} input
   * @param {String} output
   *
   * @memberOf AssetPipeline
   */
  symlink( input, output ) {
    this._copyOrSymlink( 'symlink', input, output )
  }


  /**
   * Add a file for a copy
   *
   * @param {String} input
   * @param {String} output
   *
   * @memberOf AssetPipeline
   */
  copy( input, output ) {
    this._copyOrSymlink( 'copy', input, output )
  }


  /**
   * Add a file for a copy/symlink
   *
   * @param {String} tyype
   * @param {String} input
   * @param {String} output
   *
   * @memberOf AssetPipeline
   */
  _copyOrSymlink( type, input, output ) {
    input  = _cleanPath( input )

    if (typeof output !== 'string') {
      output = input
    } else {
      output = _cleanPath( output )
    }

    this.PENDING.MOVE.push({
      from: join( this.ABSOLUTE_LOAD_PATH, input ),
      to:   join( this.ABSOLUTE_DST_PATH, output ),
      type: type
    })
  }


  /**
   * Resolve pending list
   *
   * @memberOf AssetPipeline
   */
  resolve() {

    if (!this.CACHE) this._fetchManifest()

    const keys = Object.keys(this.PENDING.OPTIONS)

    this.PENDING.LIST.resolve()

    const before = []
    const after  = []

    // Fetch paths and options
    for (let j = 0, len = this.PENDING.LIST.items.length, pth = null; j < len; j++) {
      pth = this.PENDING.LIST.items[j];

      const input = path.relative( this.ABSOLUTE_LOAD_PATH, pth )
      let options = {}

      for (let i = 0, len = keys.length; i < len; i++) {
        if (minimatch(input, keys[i])) {
          options = this.PENDING.OPTIONS[keys[i]]
        }
      }

      // Sort dirs before and file after
      if (path.extname(input).length === 0) {
        before.push({ input: input, options: options })
      } else {
        after.push({ input: input, options: options })
      }
    }

    // Resolve dirs and files
    const items = before.concat(after)
    for (let k = 0, len = items.length; k < len; k++) {
      this._resolve( items[k].input, items[k].options )
    }

  }


  /**
   * Copy of symlink files
   *
   * @memberOf AssetPipeline
   */
  proceedMove() {
    // Proceed move
    this.PENDING.MOVE.forEach(( item ) => {
      this._move(item)
    })
  }

  /**
   * Add an asset
   *
   * @param {String} input
   * @param {Object} options
   *  @param {String}  options.baseDir (Default: '')  - Create path from baseDir
   *  @param {String}  options.cache (Default: false) - Copy or symlink the asset
   *  @param {Boolean} options.share (Default: true)  - Make it share-able
   *  @param {Boolean} options.keepPath (Default: true) - Keep directories structure on path
   *  @param {Boolean} options.rename (Default: undefined) - Rename asset
   *
   * @memberOf AssetPipeline
   */
  _resolve( input, options ) {

    options = Object.assign({
      baseDir: '',
      cache: this.cacheable,
      share: true,
      keepPath: true,
      rename: undefined
    }, options || {})

    const isDirty = this._register( input, options )

    if (isDirty) this._updateManifest()

  }


  _move( item ) {
    let from = item.from
    let to   = item.to

    const moveOperation = item.type === 'symlink' ? 'ensureSymlink' : 'copy'

    const move = function(from, to) {
      if (!fs.existsSync(from)) {
        console.log( `"${from}" does not exit.` )
        return
      }

      if (!(path.extname(from) && path.extname(to))) {
        if (path.extname(from)) from = path.dirname(from)
        if (path.extname(to))   to   = path.dirname(to)
      }

      fs[moveOperation](from, to, (err)=>{
        if (err) console.log( err )
      })
    }

    const FL = new FileList
    FL.include( from )
    FL.forEach((filename) => {

      const itm = this.CACHE[relative(this.ABSOLUTE_LOAD_PATH, filename)]

      if (!itm) return

      from = filename
      to   = join( this.ABSOLUTE_DST_PATH, itm.cache || itm.output )

      move(from, to)

    })

  }


  /**
   * Add an asset
   *
   * @param {String} input
   * @param {String} baseDir
   * @returns {FileList}
   *
   * @memberOf AssetPipeline
   */
  _register( input, options ) {

    let output = input

    const baseDir   = options.baseDir
    const rename    = options.rename
    const keepPath  = options.keepPath
    const shareable = options.share
    const cacheable = options.cache
    const is_file   = !!path.extname(output)

    // Remove path and keep basename only
    if (!keepPath) {
      output = path.basename(output)
    }

    // Rename output basename
    if (typeof rename === 'string') {
      const pathObject = path.parse(output)
      pathObject.base  = rename
      output           = path.format(pathObject)
    }

    // Add baseDir
    if (baseDir) {
      output = join( this.ABSOLUTE_DST_PATH, baseDir, output )
      output = path.relative( this.ABSOLUTE_DST_PATH, output )
    }

    // Replace dirname by the value in cache
    const pathObject = path.parse(output)
    const itm       = this.CACHE[pathObject.dir]
    if (itm) pathObject.dir = itm.cache || itm.output
    output = path.format(pathObject)

    // Create a new item only if it is not shareable or does not exists in cache
    if (!(this.CACHE[input] && this.CACHE[input].output === output) || !shareable) {
      const item = {
        input: input,
        output: output
      }

      // Add cache-break
      if (cacheable) {
        if (is_file) {
          item.cache = _cacheBreak(output, this.ASSET_KEY)
        } else {
          if (this.CACHE[input]) {
            item.cache = output.replace(input, this.CACHE[input].cache)
          } else {
            item.cache = _cacheBreak(output, this.ASSET_KEY)
          }
        }
      }

      this.CACHE[input] = item

      return true
    }

    return false
  }


  /**
   * Update manifest.json file
   *
   * @memberOf AssetPipeline
   */
  _updateManifest() {
    const manifest_path = this.getManifestPath()

    // if (!fs.existsSync(manifest_path)) {
    //   process.on('SIGINT', this._deleteManifest)
    //   process.on('beforeExit', this._deleteManifest)
    // }

    const obj = {
      ASSET_KEY: this.ASSET_KEY,
      DATE: new Date,
      LOAD_PATH: this.ABSOLUTE_LOAD_PATH,
      DIST_PATH: this.ABSOLUTE_DST_PATH,
      ASSETS: this.CACHE
    }

    const ws = fs.createWriteStream(manifest_path)
    ws.write(JSON.stringify(obj, null, 2))
    ws.end()
  }


  /**
   * Fetch manifest.json and fill CACHE
   *
   * @memberOf AssetPipeline
   */
  _fetchManifest() {
    if (this.debug) {
      this.CACHE = {}
      return
    }

    const manifest_path = this.getManifestPath()

    process.on('SIGINT', this._deleteManifest)
    process.on('beforeExit', this._deleteManifest)

    if (fs.existsSync(manifest_path)) {
      try {
        this.CACHE = JSON.parse( fs.readFileSync(manifest_path).toString('utf8') ).ASSETS
      } catch(e) {
        this.CACHE = {}
        this._updateManifest()
      }
    } else {
      this.CACHE = {}
      this._updateManifest()
    }
  }


  /**
   * Delete manifest.json file
   *
   * @memberOf AssetPipeline
   */
  _deleteManifest() {
    const keep = this.debug ? true : this.KEEP_MANIFEST_FILE
    if (!keep) fs.removeSync( this.getManifestPath() )
  }

}


/**
 * Generate hash with string
 *
 * @return {String}
 *
 * @memberOf AssetPipeline
 */
AssetPipeline.md5 = function( str ) {
  return crypto.createHash('md5').update(str).digest('hex')
}


/**
 * Generate asset key
 *
 * @returns {String}
 *
 * @memberOf AssetPipeline
 */
AssetPipeline.generateAssetKey = function() {
  return AssetPipeline.md5(guid())
}

module.exports = AssetPipeline