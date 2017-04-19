'use strict'

const fs    = require('fs')
const path  = require('path')
const guid  = require('../../../lib/utils/guid')
const Print = wk.Print.new()

const Project = require('../../../lib/project').getActive()

const Loaders = {}

Loaders[ 'stylus' ] = {
  test: /\.(styl)$/,
  filename: 'stylus'
}

Loaders[ 'browserify' ] = {
  test: /\.(js)$/,
  filename: 'browserify'
}

Loaders[ 'ejs' ] = {
  test: /\.(ejs)$/,
  filename: 'ejs'
}

task('_before_compile', { visible: false, always_run: true }, function() {
  Project.configure()

  const argv = wk.COMMAND_PARAMS.__

  const INPUTS = Object.keys(Project.entries)
  INPUTS.forEach(function(input) {
    Project.entries[input] = Project.AssetPipeline.getPath(Project.entries[input])
  })

  // Get loaders
  const current_loader = argv._[1]

  for (const key in Loaders) {
    const pth = path.join( __dirname, '..', 'loaders', Loaders[key].filename, Loaders[key].filename+'.js')
    if (fs.existsSync(pth) && (!current_loader || (current_loader && key === current_loader))) {
      Loaders[key].loader = require(pth)
    }
  }

  // Prepare request loaders
  const tasks = []
  INPUTS.forEach(function(entry) {
    const LOADERS = Object.keys(Loaders)

    for (let i = 0; i < LOADERS.length; i++) {
      if (entry.match(Loaders[LOADERS[i]].test)
      && typeof Loaders[LOADERS[i]].loader === 'function') {

        const task_name = LOADERS[i]+'_'+guid.s4()

        // Create a new namespace
        namespace(task_name, Loaders[LOADERS[i]].loader)

        // Get task
        const task = wk.Tasks[task_name]
        if (task) {
          // Merge argvs
          task.argv = Object.assign({}, argv, task.argv)

          task.argv._[1]    = entry
          task.argv._[2]    = Project.entries[entry]
          task.argv.config  = LOADERS[i]
          task.argv.Project = Project

          task.argv.watch      = !!argv.watch
          task.argv.compress   = !!argv.compress
          task.argv.sourcemaps = !!argv.sourcemaps

          tasks.push( task )
        } else {
          Print.warn( 'Create a "default" task for the loader "'+ LOADERS[i] +'"' )
        }

        break
      }
    }

  })

  wk.Tasks['compile:compile'].argv.tasks = tasks
})

task('_compile', { visible: false, always_run: true, async: true }, function() {
  parallel(this.argv.tasks).then(this.complete).catch(this.fail)
})

task('compile', [
  'classic:_before_compile',
  'classic:_compile'
])