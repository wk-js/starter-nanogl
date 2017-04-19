'use strict'

const path = require('path')

const Project = require('../lib/project')
let PR        = null

const EXCEPTIONS = {
  "**/*.js": {
    contentType: "application/javascript"
  },
  "**/*.css": {
    contentType: "text/css"
  },
  "**/*.bin": {
    contentType: "application/octet-stream",
    contentEncoding: "gzip"
  },
  "**/*.awd": {
    contentType: "application/octet-stream",
    contentEncoding: "gzip"
  },
  "**/*.ktx": {
    contentType: "application/octet-stream",
    contentEncoding: "gzip"
  },
  "**/*.dds": {
    contentType: "application/octet-stream",
    contentEncoding: "gzip"
  },
  "**/*.pvr": {
    contentType: "application/octet-stream",
    contentEncoding: "gzip"
  }
}

function createProject() {
  if (PR) return PR

  PR = Project.getConfiguredProject()
  return PR
}

function print(  ) {
  const args = wk.Print.green.apply(wk.Print, arguments)
  wk.Print.log( args )
}

desc('[AWS] GZIP files')
task('gzip', { async: true }, function() {
  createProject()

  const cmds = []

  const FL = new wk.FileList.FileList

  for (const key in EXCEPTIONS) {
    if (EXCEPTIONS[key].contentEncoding && EXCEPTIONS[key].contentEncoding.match(/gzip/gi)) {
      FL.include(path.join(PR.AssetPipeline.DST_PATH, key ))
    }
  }

  FL.forEach((f) => {

    const filename = path.basename(f)

    cmds.push({
      cwd: path.dirname(f),
      // command: `gzip -9 -c ${filename} > ${filename}`
      command: `gzip -9 ${filename}`
    })

    cmds.push({
      cwd: path.dirname(f),
      command: `mv ${filename}.gz ${filename}`
    })

  })

  wk.exec(cmds, { sequence: 'serie' }).then(() => {
    print('[AWS]', 'File gzipped')
    this.complete()
  }).catch(this.fail)
})

desc('[AWS] Push objects')
task('objects', { async: true }, function() {

  createProject()

  const excludes = Object.keys(EXCEPTIONS).map(function(exception) {
    return '--exclude="'+ exception +'"'
  }).join(' ')

  const cmd = [
    'aws s3',
    'sync',
    PR.AssetPipeline.DST_PATH,
    `s3://${PR.data.bucket_name}`,
    '--acl public-read',
    '--output json',
    '--delete',
    '--profile eb-serverless-for-honor',
    '--region eu-west-1',
    excludes
  ]

  console.log( cmd.join(' ') ); this.complete()
  // wk.exec(cmd.join(' ')).then(() => {
  //   print('[AWS]', 'Synchronization finished')
  //   this.complete()
  // }).catch(this.fail)

})

desc('[AWS] Push exception')
task('exception', { async: true }, function() {
  createProject()

  const requests = []
  let request    = []

  for (const key in EXCEPTIONS) {
    request = [
      'aws s3',
      'sync',
      PR.AssetPipeline.DST_PATH,
      `s3://${PR.data.bucket_name}`,
      '--acl public-read',
      '--output json',
      '--profile eb-serverless-for-honor',
      '--region eu-west-1'
    ]

    if (EXCEPTIONS[key].contentEncoding) {
      request.push( `--content-encoding "${EXCEPTIONS[key].contentEncoding}"` )
    }

    if (EXCEPTIONS[key].contentType) {
      request.push( `--content-type "${EXCEPTIONS[key].contentType}"` )
    }

    request.push(
      '--exclude "*"',
      `--include "${key}"`
    )

    requests.push( request.join(' ') )
  }

  console.log(requests); this.complete()
  // wk.exec(requests).then(() => {
  //   print('[AWS]', 'Synchronization finished')
  //   this.complete()
  // }).catch(this.fail)
})


desc(`[AWS] Deploy to AWS Bucket`)
task('default', [
  'aws:gzip',
  'aws:objects',
  'aws:exception'
], { preReqSequence: 'serie' })