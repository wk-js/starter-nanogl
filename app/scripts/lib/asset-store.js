'use strict'

import MediaLoader from './media-loader'
import when from 'when'

class AssetStore {

  constructor() {
    this.mediaLoader = MediaLoader.new()
    this.assets      = {}
    this.manifest    = new ManifestStore
  }

  new() {
    return new AssetStore
  }

  getAssets( manifest ) {
    return Object.keys(manifest).map(function( key ) {
      manifest[key].id = key
      return manifest[key]
    })
  }

  load( manifest ) {
    Object.assign(this.assets, manifest)

    const assets = this.getAssets( manifest )
    this.mediaLoader.load( assets )

    this.mediaLoader._queue.items.forEach((item) => {
      const key = item.url
      if (!this.assets[key]) return

      this.assets[key] = Object.assign(this.assets[key], item)
    })

    return this.mediaLoader.start()
  }

  loadFonts( fontManifest ) {
    let $preload = document.querySelector('font-loader')
    $preload     = $preload ? $preload : document.createElement('div')
    $preload.style.cssText = 'opacity: 0; visibility: hidden; pointer-events: none; position: absolute; top: 0;'

    let html = ""

    for (const key in fontManifest) {
      html += `<span style="${fontManifest[key]}">${key}</span>\n`
    }

    $preload.innerHTML = html

    if (!$preload.parentNode) document.body.appendChild( $preload )

    this.$preload = $preload
  }

  get( asset_path, async ) {
    const asset = this.assets[asset_path]
    if (async && asset) {
      return asset.promise
    }
    return asset
  }

}



/**
 * MANIFEST STORE
 */

class ManifestStore {

  constructor() {
    this.manifest = window.manifest

    for (const key in this.manifest) {
      this.manifest[key].url = this.manifest[key].asset_path
    }
  }

  add(manifest) {
    for (const key in manifest) {
      this.manifest[key] = this.manifest[key] || {}
      Object.assign(this.manifest[key], manifest[key])
    }
  }

  getUrl(key) {
    return this.manifest[key] ? this.manifest[key].asset_url : null
  }

  getPath(key) {
    return this.manifest[key] ? this.manifest[key].asset_path : null
  }

  getPaths(filter) {
    const man = this.filter(filter)
    return Object.keys(man).map(function(key) {
      return man[key].asset_path
    })
  }

  getUrls(filter) {
    const man = this.filter(filter)
    return Object.keys(man).map(function(key) {
      return man[key].asset_path
    })
  }

  get(key) {
    return this.manifest[key]
  }

  filter(filter) {
    if (!filter) return this.manifest

    const mnfst = {}

    for (const key in this.manifest) {
      if (Array.isArray(this.manifest[key].filter)) {
        if (this.manifest[key].filter.indexOf(filter) !== -1) {
          mnfst[key] = this.manifest[key]
        }
      }
    }

    return mnfst
  }

}

const _assetStore = new AssetStore
module.exports =_assetStore