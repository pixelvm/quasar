const fse = require('fs-extra')

const { log, warn } = require('../../utils/logger.js')
const { isModeInstalled } = require('../modes-utils.js')

const pwaDevDeps = {
  'workbox-webpack-plugin': '^7.0.0'
}

const pwaDeps = {
  'register-service-worker': '^1.7.2'
}

module.exports.addMode = function addMode ({
  ctx: { appPaths, cacheProxy },
  silent
}) {
  if (isModeInstalled(appPaths, 'pwa')) {
    if (silent !== true) {
      warn('PWA support detected already. Aborting.')
    }
    return
  }

  const nodePackager = cacheProxy.getModule('nodePackager')
  nodePackager.installPackage(
    Object.entries(pwaDevDeps).map(([ name, version ]) => `${ name }@${ version }`),
    { isDevDependency: true, displayName: 'PWA dev dependencies' }
  )
  nodePackager.installPackage(
    Object.entries(pwaDeps).map(([ name, version ]) => `${ name }@${ version }`),
    { displayName: 'PWA dependencies' }
  )

  log('Creating PWA source folder...')

  const hasTypescript = cacheProxy.getModule('hasTypescript')
  const { hasEslint } = cacheProxy.getModule('eslint')
  const format = hasTypescript ? 'ts' : 'js'

  fse.copySync(
    appPaths.resolve.cli(`templates/pwa/${ format }`),
    appPaths.pwaDir,
    // Copy .eslintrc.js only if the app has ESLint
    hasEslint === true ? { filter: src => !src.endsWith('/.eslintrc.cjs') } : void 0
  )

  log('Copying PWA icons to /public/icons/ (if they are not already there)...')
  fse.copySync(
    appPaths.resolve.cli('templates/pwa-icons'),
    appPaths.resolve.app('public/icons'),
    { overwrite: false }
  )

  log('PWA support was added')
}

module.exports.removeMode = function removeMode ({
  ctx: { appPaths, cacheProxy }
}) {
  if (isModeInstalled(appPaths, 'pwa') === false) {
    warn('No PWA support detected. Aborting.')
    return
  }

  log('Removing PWA source folder')
  fse.removeSync(appPaths.pwaDir)

  const nodePackager = cacheProxy.getModule('nodePackager')
  nodePackager.uninstallPackage(Object.keys(pwaDevDeps), {
    displayName: 'PWA dev dependencies'
  })
  nodePackager.uninstallPackage(Object.keys(pwaDeps), {
    displayName: 'PWA dependencies'
  })

  log('PWA support was removed')
}
