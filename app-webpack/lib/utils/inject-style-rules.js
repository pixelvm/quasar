const ExtractLoader = require('mini-css-extract-plugin').loader
const { merge } = require('webpack-merge')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const quasarCssPaths = [
  path.join('node_modules', 'quasar', 'dist'),
  path.join('node_modules', 'quasar', 'src'),
  path.join('node_modules', '@quasar')
]

const absoluteUrlRE = /^[a-z][a-z0-9+.-]*:/i
const protocolRelativeRE = /^\/\//
const templateUrlRE = /^[{}[\]#*;,'§$%&(=?`´^°<>]/
const rootRelativeUrlRE = /^\//

/**
 * Inspired by loader-utils > isUrlRequest()
 * Mimics Webpack v4 & css-loader v3 behavior
 */
function shouldRequireUrl (url) {
  return (
    // an absolute url and it is not `windows` path like `C:\dir\file`:
    (absoluteUrlRE.test(url) === true && path.win32.isAbsolute(url) === false)
    // a protocol-relative:
    || protocolRelativeRE.test(url) === true
    // some kind of url for a template:
    || templateUrlRE.test(url) === true
    // not a request if root isn't set and it's a root-relative url
    || rootRelativeUrlRE.test(url) === true
  ) === false
}

async function createRule ({ rule, isModules, pref, loader, loaderOptions }) {
  if (pref.isServerBuild === true) {
    rule.use('null-loader')
      .loader('null-loader')
    return
  }

  if (pref.extract) {
    rule.use('mini-css-extract')
      .loader(ExtractLoader)
      .options({ publicPath: '../' })
  }
  else {
    rule.use('vue-style-loader')
      .loader('vue-style-loader')
      .options({
        sourceMap: pref.sourceMap
      })
  }

  const cssLoaderOptions = {
    sourceMap: pref.sourceMap,
    url: { filter: shouldRequireUrl },
    importLoaders:
      1 // stylePostLoader injected by vue-loader
      + 1 // postCSS loader
      + (!pref.extract && pref.minify ? 1 : 0) // postCSS with cssnano
      + (loader ? (loader === 'sass-loader' ? 2 : 1) : 0)
  }

  if (isModules) {
    Object.assign(cssLoaderOptions, {
      modules: {
        localIdentName: '[name]_[local]_[hash:base64:5]'
      }
    })
  }

  rule.use('css-loader')
    .loader('css-loader')
    .options(cssLoaderOptions)

  if (!pref.extract && pref.minify) {
    // needs to be applied separately,
    // otherwise it messes up RTL
    rule.use('cssnano')
      .loader('postcss-loader')
      .options({
        sourceMap: pref.sourceMap,
        postcssOptions: {
          plugins: [
            require('cssnano')({
              preset: [ 'default', {
                mergeLonghand: false,
                convertValues: false,
                cssDeclarationSorter: false,
                reduceTransforms: false
              } ]
            })
          ]
        }
      })
  }

  // need a fresh copy, otherwise plugins
  // will keep on adding making N duplicates for each one
  const { default: postCssConfig } = await import(
    pathToFileURL(pref.appPaths.postcssConfigFilename)
    + '?t='
    + Date.now()
  )

  let postCssOpts = { sourceMap: pref.sourceMap, ...postCssConfig }

  if (pref.rtl) {
    const postcssRTL = require('postcss-rtlcss')
    const postcssRTLOptions = pref.rtl === true ? {} : pref.rtl

    if (
      typeof postCssConfig.plugins !== 'function'
      && (postcssRTLOptions.source === 'ltr' || typeof postcssRTLOptions === 'function')
    ) {
      const originalPlugins = postCssOpts.plugins ? [ ...postCssOpts.plugins ] : []

      postCssOpts = ctx => {
        const plugins = [ ...originalPlugins ]
        const isClientCSS = quasarCssPaths.every(item => ctx.resourcePath.indexOf(item) === -1)

        plugins.push(postcssRTL(
          typeof postcssRTLOptions === 'function'
            ? postcssRTLOptions(isClientCSS, ctx.resourcePath)
            : {
                ...postcssRTLOptions,
                source: isClientCSS ? 'rtl' : 'ltr'
              }
        ))

        return { sourceMap: pref.sourceMap, plugins }
      }
    }
    else {
      postCssOpts.plugins.push(postcssRTL(postcssRTLOptions))
    }
  }

  rule.use('postcss-loader')
    .loader('postcss-loader')
    .options({ postcssOptions: postCssOpts })

  if (loader) {
    rule.use(loader)
      .loader(loader)
      .options({
        sourceMap: pref.sourceMap,
        ...loaderOptions
      })

    if (loader === 'sass-loader') {
      if (loaderOptions?.sassOptions?.syntax === 'indented') {
        rule.use('quasar-sass-variables-loader')
          .loader(pref.cssVariables.loader)
          .options(pref.cssVariables.sass)
      }
      else {
        rule.use('quasar-scss-variables-loader')
          .loader(pref.cssVariables.loader)
          .options(pref.cssVariables.scss)
      }
    }
  }
}

function injectRule (chain, pref, lang, test, loader, loaderOptions) {
  const baseRule = chain.module.rule(lang).test(test)

  // rules for <style lang="module">
  const modulesRule = baseRule.oneOf('modules-query').resourceQuery(/module/)

  // rules for *.module.* files
  const modulesExtRule = baseRule.oneOf('modules-ext').test(/\.module\.\w+$/)

  // rules for normal styles
  const normalRule = baseRule.oneOf('normal')

  return Promise.all([
    createRule({ rule: modulesRule, isModules: true, pref, loader, loaderOptions }),
    createRule({ rule: modulesExtRule, isModules: true, pref, loader, loaderOptions }),
    createRule({ rule: normalRule, isModules: false, pref, loader, loaderOptions })
  ])
}

module.exports.injectStyleRules = async function injectStyleRules (chain, pref) {
  await injectRule(chain, pref, 'css', /\.css$/)
  await injectRule(chain, pref, 'stylus', /\.styl(us)?$/, 'stylus-loader', pref.stylusLoaderOptions)
  await injectRule(chain, pref, 'scss', /\.scss$/, 'sass-loader', merge(
    {
      sassOptions: {
        style: /* required for RTL */ 'expanded',
        silenceDeprecations: [ 'import', 'global-builtin' ]
      },
      api: 'modern-compiler'
    },
    pref.scssLoaderOptions
  ))
  await injectRule(chain, pref, 'sass', /\.sass$/, 'sass-loader', merge(
    {
      sassOptions: {
        style: /* required for RTL */ 'expanded',
        syntax: 'indented',
        silenceDeprecations: [ 'import', 'global-builtin' ]
      },
      api: 'modern-compiler'
    },
    pref.sassLoaderOptions
  ))
  await injectRule(chain, pref, 'less', /\.less$/, 'less-loader', pref.lessLoaderOptions)
}
