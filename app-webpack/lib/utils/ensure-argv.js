const { fatal } = require('./logger.js')

module.exports.ensureArgv = function ensureArgv (argv, cmd) {
  if (argv.mode) {
    if (argv.mode === 'ios') {
      argv.m = argv.mode = 'capacitor'
      argv.T = argv.target = 'ios'

      console.log()
      console.log(' Converting to long form: -m capacitor -T ios')
    }
    else if (argv.mode === 'android') {
      argv.m = argv.mode = 'capacitor'
      argv.T = argv.target = 'android'

      console.log()
      console.log(' Converting to long form: -m capacitor -T android')
    }
  }

  if (![ 'spa', 'pwa', 'cordova', 'capacitor', 'electron', 'ssr', 'bex' ].includes(argv.mode)) {
    fatal(`Unknown mode "${ argv.mode }"`)
  }

  if (cmd === 'inspect') return

  if (argv.mode === 'capacitor') {
    const targets = [ 'android', 'ios' ]
    if (!argv.target) {
      fatal(`Please also specify a target (-T <${ targets.join('|') }>)`)
    }
    if (!targets.includes(argv.target)) {
      fatal(`Unknown target "${ argv.target }" for Capacitor`)
    }
  }

  if (argv.mode === 'cordova') {
    const targets = [ 'android', 'ios', 'electron', 'blackberry10', 'browser', 'osx', 'ubuntu', 'webos', 'windows' ]
    if (!argv.target) {
      fatal(`Please also specify a target (-T <${ targets.join('|') }>)`)
    }
    if (!targets.includes(argv.target)) {
      fatal(`Unknown target "${ argv.target }" for Cordova\n`)
    }
  }

  if (argv.mode === 'bex') {
    const targets = [ 'chrome', 'firefox' ]
    if (!argv.target) {
      fatal(`Please also specify a target (-T <${ targets.join('|') }>)`)
    }
    if (!targets.includes(argv.target)) {
      fatal(`Unknown target "${ argv.target }" for BEX`)
    }
  }

  if (cmd === 'build' && argv.mode === 'electron') {
    if (![ undefined, 'packager', 'builder' ].includes(argv.bundler)) {
      fatal(`Unknown bundler "${ argv.bundler }" for Electron`)
    }
  }
}

module.exports.ensureElectronArgv = function ensureElectronArgv (bundlerName, ctx) {
  if (![ 'packager', 'builder' ].includes(bundlerName)) {
    fatal(`Unknown bundler "${ bundlerName }" for Electron`)
  }

  if (bundlerName === 'packager') {
    if (![ undefined, 'all', 'darwin', 'win32', 'linux', 'mas' ].includes(ctx.targetName)) {
      fatal(`Unknown target "${ ctx.targetName }" for @electron/packager`)
    }
    if (![ undefined, 'ia32', 'x64', 'armv7l', 'arm64', 'mips64el', 'all' ].includes(ctx.archName)) {
      fatal(`Unknown architecture "${ ctx.archName }" for @electron/packager`)
    }
  }
  else { // electron-builder bundler
    if (![ undefined, 'all', 'darwin', 'mac', 'win32', 'win', 'linux' ].includes(ctx.targetName)) {
      fatal(`Unknown target "${ ctx.targetName }" for electron-builder`)
    }
    if (![ undefined, 'ia32', 'x64', 'armv7l', 'arm64', 'all' ].includes(ctx.archName)) {
      fatal(`Unknown architecture "${ ctx.archName }" for electron-builder`)
    }
  }
}
