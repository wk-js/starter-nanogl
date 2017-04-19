'use strict'

const path = require('path')
const join = path.join
const CWD  = process.cwd()

module.exports = (function() {

  return {

    CWD: CWD,
    NOOP: function() {},

    APP_PATH: join( CWD, 'app' ),

    PACKAGE_JSON_PATH: path.resolve('package.json'),

    CONFIG_PATH: join( CWD, 'config' ),

    LOCALES_PATH: join( CWD, 'config', 'locales' ),
    ENV_PATH: join( CWD, 'config', 'environments' ),

    LIB_PATH: join( CWD, 'workflow', 'lib' ),
    TASKS_PATH: join( CWD, 'workflow', 'tasks' ),
    LOADERS_PATH: join( CWD, 'workflow', 'loaders' ),
    UTILS_PATH: join( CWD, 'workflow', 'utils' ),

    TMP_PATH: join( CWD, 'tmp' ),

    DIST_PATH: join( CWD, 'app/dist' ),

    WEBPACK_CLI: join( CWD, 'node_modules', '.bin', 'webpack' ),
    WEBPACK_SERVER_CLI: join( CWD, 'node_modules', '.bin', 'webpack-dev-server' ),
    WEBPACK_CONFIG_PATH: join( CWD, 'workflow', 'asset-builder', 'webpack', 'configs' ),

    TEMPLATES_PATH: join( CWD, 'workflow', 'tasks', 'template', 'templates' )

  }

})()