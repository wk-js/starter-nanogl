'use strict'

const path = require('path')
const BROWSER_SYNC_CLI = path.join(path.dirname(require.resolve('browser-sync')), 'bin', 'browser-sync.js')

task('server', function() {
  const options  = this.argv || {}

  const command = [BROWSER_SYNC_CLI, 'start']
  let value = null

  for (const key in options) {
    value = options[key]
    if (typeof value === 'boolean') {
      if (value) command.push('--'+key)
    } else {
      if (typeof value !== 'string') value = value.toString()
      command.push(`--${key}='${value}'`)
    }
  }

  wk.exec(command.join(' '))

})