'use strict'

import { EventEmitter } from 'events'
import when from 'when'
import parallel from 'when/parallel'
import Net from './net'

let TYPE_KEYS     = []
const TYPES       = {}
const typesRegExp = /(image|audio|video|magipack|pixi|xhr)/gi

function NOOP() {}

class Loader {

  constructor() {
    this._queue = new LoaderQueue(this)
    this.breakOnErrorLoading = true
  }



  /**
   * Create a new loader
   *
   * @returns {Loader}
   *
   * @memberOf Loader
   */
  new() {
    return new Loader
  }



  /**
   * Register a new type loader
   *
   * @param {any} type
   * @param {any} regexOrCb
   * @param {any} cb
   *
   * @memberOf Loader
   */
  addType(type, regexOrCb, cb) {
    TYPES[type] = {}

    let regex = regexOrCb

    if (typeof regexOrCb === 'function') {
      cb    = regexOrCb
      regex = null
    }

    TYPES[type].load = cb
    if (regex) TYPES[type].regex = regex
    TYPE_KEYS = Object.keys(TYPES)
  }



  /**
   * Load an url, or an item or array of urls or items
   *
   * @param {String|Object|Array} urlOrItemOrArray
   * @param {Boolean} [doNotIterate=false]
   * @returns
   *
   * @memberOf Loader
   */
  load(urlOrItemOrArray) {
    // Check queue
    if (this._queue.loading || this._queue.loaded) {
      this.resetQueue()
    }

    // Is an url
    if (typeof urlOrItemOrArray === 'string') {
      this._loadUrl(urlOrItemOrArray)
    }

    // Is an array
    else if (Array.isArray(urlOrItemOrArray)) {
      urlOrItemOrArray.forEach((item) => {
        this.load(item, true)
      })
    }

    // Is an item
    else if (urlOrItemOrArray.hasOwnProperty('url')) {
      if (urlOrItemOrArray.hasOwnProperty('type')) {
        this._loadItem(urlOrItemOrArray)
      } else {
        this._loadUrl(urlOrItemOrArray.url, urlOrItemOrArray)
      }
    }

    else {
      console.log("This content cannot be loaded")
      return false
    }
  }




  /**
   * Reset the active queue
   *
   * @returns
   *
   * @memberOf Loader
   */
  resetQueue() {
    this._queue = new LoaderQueue
  }



  /**
   * Start the loading of the active queue and reset
   *
   * @returns {LoaderQueue}
   *
   * @memberOf Loader
   */
  start() {
    if (this._queue && typeof this._queue.start === 'function') {
      const queue = this._queue
      queue.start()
      return queue
    }
  }



  /**
   * Load an item
   *
   * @param {Object} item
   * @returns {Boolean}
   *
   * @memberOf Loader
   */
  _loadItem(item) {
    if (item.url && item.type && TYPE_KEYS.indexOf(item.type) !== -1) {

      // Prepare load function
      const loadable = () => {
        const fullfilled = (result) => {
          item.result = result
          item._resolve(item)
          if (typeof clean === 'function') clean()
        }

        const rejected = (result) => {
          item.result = result
          item._reject(item)
          if (typeof clean === 'function') clean()
        }

        const clean = TYPES[item.type].load(item, fullfilled, rejected)

        return item.promise
      }

      // Save load function
      item.loadable = loadable

      // Save resolve and reject functions
      item.promise = when.promise(function(resolve, reject) {
        item._resolve = resolve
        item._reject  = reject
      })

      // Add item to the queue
      this._queue.addItem(item)

      return true
    }

    console.log('This item cannot be loaded', item)
    return false
  }



  /**
   * Load a url
   *
   * @param {String} url
   * @returns {Boolean}
   *
   * @memberOf Loader
   */
  _loadUrl(url, item) {
    var item = item || { url: url }

    var types = TYPE_KEYS.map(function(key) {
      return { type: key, regex: TYPES[key].regex }
    })

    for (var i = 0, len = types.length; i < len; i++) {
      if (types[i].regex && url.match(types[i].regex)) {
        item.type = types[i].type
        continue
      }
    }

    return this._loadItem( item )
  }

}






/**
 *
 *
 * @class LoaderQueue
 * @extends {EventEmitter}
 */
class LoaderQueue extends EventEmitter  {

  constructor() {
    super()

    // Binding
    this._onFileLoaded = this._onFileLoaded.bind(this)
    this._onError  = this._onError.bind(this)
    this._onComplete   = this._onComplete.bind(this)

    // Setup
    this.items     = []
    this.loadables = []

    // Promise part
    this._resolve = null
    this._reject  = null

    this.promise = when.promise((resolve, reject) => {
      this._resolve = resolve
      this._reject  = reject
    })
    .catch(this._onError)
    .then(this._onComplete)

    // Progress part
    this.itemLoaded = 0
    this.progress   = 0
    this.loading    = false
    this.loaded     = false
  }


  /**
   * Add a new item to the queue
   *
   * @param {Object} item
   *
   * @memberOf LoaderQueue
   */
  addItem(item) {
    item.promise.tap(this._onFileLoaded)
    this.loadables.push(item.loadable)
    this.items.push(item)
  }



  /**
   * Start loading
   *
   * @returns {Promise}
   *
   * @memberOf LoaderQueue
   */
  start() {
    this.loading = true
    this.loaded  = false

    // Start loading
    return parallel(this.loadables)
    .then(this._resolve)
    .catch(this._reject)
  }


  /**
   * Listen fileloaded event
   *
   * @param {Function} fn
   * @returns {LoaderQueue}
   *
   * @memberOf LoaderQueue
   */
  notify(fn) {
    this.on('fileloaded', fn)
    return this
  }



  /**
   * Listen error event
   *
   * @param {Function} fn
   * @returns {LoaderQueue}
   *
   * @memberOf LoaderQueue
   */
  error(fn) {
    // this.on('error', fn)
    this.promise.catch(fn)
    return this
  }



  /**
   * Listen complete event
   *
   * @param {Function} fn
   * @returns {LoaderQueue}
   *
   * @memberOf LoaderQueue
   */
  complete(fn) {
    this.loading = false
    this.loaded  = true

    // this.on('complete', fn)
    this.promise.then(fn)
    return this
  }


  /**
   * Load item complete callback
   *
   * @param {Object} item
   * @param {Number} progress
   * @returns {Object}
   *
   * @memberOf Loader
   */
  _onFileLoaded(item) {
    this.itemLoaded++
    this.progress = this.itemLoaded / this.items.length
    this.emit('fileloaded', this.progress, item)
    return { item: item, progress: this.progress }
  }



  /**
   * Load item error callback
   *
   * @param {Object} item
   * @returns {Object}
   *
   * @memberOf Loader
   */
  _onError(item) {
    this.emit('error', item)
    return item
  }



  /**
   * Load complete callback
   *
   * @param {Array} items
   * @returns {Array}
   *
   * @memberOf Loader
   */
  _onComplete(items) {
    this.emit('complete', items)
    return items
  }

}











const LoaderSingleton = new Loader


/**
 * Load Image
 */
LoaderSingleton.addType('image', /.(jpg|jpeg|png|gif)/gi, function(item, onFileLoaded, onFileError) {
  var image = new Image
  if (item.options && item.options.crossOrigin) image.crossOrigin = item.options.crossOrigin
  image.onload  = onFileLoaded
  image.onerror = onFileError
  image.src     = item.url
  item.element  = image

  return function() {
    image.onload  = null
    image.onerror = null
  }
})


/**
 * Load HTML5 Audio / Video
 */
LoaderSingleton.addType('media', /.(mp3|ogg|mp4|ogv|webm)/gi, function(item, onFileLoaded, onFileError) {
  const AudioRegExp = /.(mp3|ogg)/gi
  const VideoRegExp = /.(mp4|ogv|webm)/gi

  var media = item.url.match(AudioRegExp) ? document.createElement('audio') : item.url.match(VideoRegExp) ? document.createElement('video') : null

  if (!media) {
    console.log('Element invalid')
    return false
  }

  media.preload = 'auto'
  media.addEventListener('loadedmetadata', onFileLoaded, false)
  media.addEventListener('error', onFileError, false)
  media.src = item.url
  media.load()
  item.element = media

  return function() {
    media.removeEventListener('loadedmetadata', onFileLoaded, false)
    media.removeEventListener('error', onFileError, false)
  }
})



/**
 * Load Magipack
 */
LoaderSingleton.addType('magipack', /.(pack)/gi, function(item, onFileLoaded, onFileError) {
  if (!window.Magipack) {
    console.log('Magipack is not defined')
    return false
  }

  if (!window.Magipacks) {
    window.Magipacks = {}
  }

  const options = item.options || {}

  var mgpack = new window.Magipack
  mgpack.onLoadComplete = onFileLoaded
  mgpack.load(item.url, options.json)
  item.magipack = mgpack
  window.Magipacks[item.id] = mgpack

  return function() {
    mgpack.onLoadComplete = null
  }
})


/**
 * Load XHR
 */
LoaderSingleton.addType('xhr', function(item, onFileLoaded, onFileError) {

  Net.load(item.url, item.options)
     .then(onFileLoaded)
     .catch(onFileError)

  return function() {}

})


/**
 * Load howler sound
 */
LoaderSingleton.addType('howler', function(item, onFileLoaded, onFileError) {
  if (!window.Howl || !window.Howler) {
    console.log('Howler is not defined')
    return false
  }

  const options = item.options || {}

  var sound = new window.Howl(Object.assign({
    src: item.url || item.urls,
    preload: true,
    autoplay: false,
    html5: false,
    onload: onFileLoaded,
    onloaderror: onFileError
  }, options))

  item.sound = sound

  return function() {}
})


/**
 * Load THREE.Texture
 */
LoaderSingleton.addType('three-texture', function(item, onFileLoaded, onFileError) {

  const loader = new THREE.TextureLoader
  loader.load(item.url, onFileLoaded, NOOP, onFileError)

  return function() {}
})


/**
 * Load THREE.Mesh
 */
LoaderSingleton.addType('three-obj', function(item, onFileLoaded, onFileError) {

  const loader = new THREE.OBJLoader
  loader.load(item.url, onFileLoaded, NOOP, onFileError)

  return function() {}

})



export default LoaderSingleton