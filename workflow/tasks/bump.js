'use strict'

const fs   = require('fs')
const path = require('path')

function getPackagePath() {
  return path.resolve('package.json')
}

function getPackage() {
  return JSON.parse(fs.readFileSync(getPackagePath()))
}

function getCurrentVersion() {
  return getPackage().build
}

function pad( str, padding, max, append ) {

  if (append) {
    return str.length === max ? str : pad(str + padding, padding, max, append)
  }



  return str.length === max ? str : pad(padding + str, padding, max)
}

function getNextVersion() {

  const current = getCurrentVersion().split('.')
  const version = current[0]
  let patch     = parseInt(current[1])

  const date  = new Date
  const year  = pad(date.getFullYear().toString(), "0", 4)
  const month = pad((date.getMonth() + 1).toString(), "0", 2)
  const day   = pad(date.getDate().toString(), "0", 2)

  const nextVersion = year+month+day

  if (version !== nextVersion) {
    patch = 0
  } else {
    if (isNaN(patch)) patch = 0
    else patch++
  }

  return nextVersion + '.' + patch
}




/**
 * Check the git stage is clean
 */
taskProcess('stage_clean', 'git status --porcelain --untracked-files=no', function(err, stdout) {
  if (stdout.length !== 0) return this.fail(`Stage is not clean`)

  this.complete()
}, { async: true, visible: false, process: { printStdout: false } })


/**
 * Ask to the user a version confirmation
 */
task('confirm_version', { async: true, visible: false }, function() {
  const nextVersion = getNextVersion()

  console.log(`Next version: ${nextVersion}`)

  wk.utils.prompt('Continue? ', ( answer ) => {
    if (answer[0] === 'y') {
      this.complete( nextVersion )
    } else {
      this.fail( 'Bump aborted' )
    }
  })
})


/**
 * Bump the new version to package.json
 */
task('bump_version', { visible: false }, function() {
  const pkg   = getPackage()
  pkg.build = getNextVersion()

  const pth = path.join('package.json')
  fs.writeFileSync(pth, JSON.stringify(pkg, true, 2) + '\n')
})


/**
 * Add, commit and tag new version
 */
task('commit_version', { async: true, visible: false }, function() {
  const version = getPackage().build

  const cmds = [
    `git add ${getPackagePath()}`,
    `git commit -m "Bump ${version}"`,
    `git tag -a v${version} -m "Release ${version}"`,
    `git push --tags`
  ]

  const opts = {}
  if (process.platform == 'win32') {
    opts.windowsVerbatimArguments = true
  }

  wk.exec(cmds).catch(this.fail).done(() => {
    wk.Print.log(
      wk.Print.green(`Version ${version} bumped !`)
    )
    this.complete()
  })
})


desc('Bump a new version')
task('default', [
  'bump:stage_clean',
  'bump:confirm_version',
  'bump:bump_version',
  'bump:commit_version'
])