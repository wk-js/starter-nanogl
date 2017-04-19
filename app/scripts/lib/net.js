'use strict'

const when = require('when')

module.exports = {

  load: function(url, options) {
    var o = Object.assign({
      method: 'GET',
      responseType: '',
      mimeType: null,
      headers: [],
      datas: null
    }, options || {})

    return when.promise(function(resolve, reject) {
      var request = new XMLHttpRequest
      request.open(o.method, url, true)
      request.responseType = o.responseType

      for (var i = 0; i < o.headers.length; i++) {
        request.setRequestHeader( o.headers[i].key, o.headers[i].value )
      }

      if (o.mimeType && request.overrideMimeType) request.overrideMimeType(o.mimeType)

      request.onload = function(e) {
        if (e.currentTarget.status >= 200 && e.currentTarget.status < 300) {
          resolve(e.currentTarget)
        } else {
          reject({
            status: e.currentTarget.status,
            error: e.currentTarget.statusText,
            request: e.currentTarget
          })
        }
      }

      request.onerror = function() {
        reject({
          status: request.status,
          error: request.statusText,
          request: request
        })
      }

      request.send(o.datas)
    })
  },

  loadArrayBuffer: function(url, options) {
    return this.load(url, Object.assign({
      responseType: 'arraybuffer'
    }, options || {}))
  },

  loadXML: function(url, options) {
    return this.load(url, Object.assign({
      responseType: 'document',
      mimeType: 'text/xml'
    }, options || {}))
  },

  loadJSON: function(url, options) {
    return this.load(url, Object.assign({
      responseType: 'json',
      mimeType: 'text/json'
    }, options || {}))
  }

}
