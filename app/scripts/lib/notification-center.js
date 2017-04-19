'use strict'

import { EventEmitter } from 'events'

const NotificationCenter = new EventEmitter

Object.defineProperty(NotificationCenter, 'off', {
  value: NotificationCenter.removeListener,
  enumerable: true,
  writable: false
})

module.exports = NotificationCenter