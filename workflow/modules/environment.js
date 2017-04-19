'use strict'

const path     = require('path')
const CONSTS   = require('../constants')

module.exports = function(Project) {

  const ENVIRONMENT = process.env.ENV || 'development'
  const ENV_FILE    = require( path.join(CONSTS.ENV_PATH, ENVIRONMENT) )

  ENV_FILE( Project )

  Project.addData('infos', {
    environment: ENVIRONMENT
  })

}