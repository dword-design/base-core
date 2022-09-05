import { endent, identity } from '@dword-design/functions'
import deepmerge from 'deepmerge'
import depcheck from 'depcheck'
import depcheckDetectorExeca from 'depcheck-detector-execa'
import depcheckDetectorPackageName from 'depcheck-detector-package-name'
import depcheckParserBabel from 'depcheck-parser-babel'
import importCwd from 'import-cwd'

import depcheckSpecialBaseConfig from './depcheck-special-base-config'
import packageConfig from './package-config'
import rawConfig from './raw-config'

const defaultConfig = {
  allowedMatches: [],
  commands: {},
  coverageFileExtensions: [],
  depcheckConfig: {
    detectors: [
      depcheck.detector.importDeclaration,
      depcheck.detector.requireCallExpression,
      depcheck.detector.requireResolveCallExpression,
      depcheckDetectorExeca,
      depcheckDetectorPackageName,
    ],
    ignorePath: '.gitignore',
    parsers: {
      '**/*.js': depcheckParserBabel,
    },
    specials: [depcheckSpecialBaseConfig, depcheck.special.bin],
  },
  deployAssets: [],
  deployEnv: {},
  deployPlugins: [],
  editorIgnore: [],
  gitignore: [],
  lint: identity,
  nodeVersion: 14,
  preDeploySteps: [],
  prepare: identity,
  readmeInstallString: endent`
    ## Install

    \`\`\`bash
    # npm
    $ npm install ${rawConfig.global ? '-g ' : ''}${packageConfig.name}

    # Yarn
    $ yarn ${rawConfig.global ? 'global ' : ''}add ${packageConfig.name}
    \`\`\`
  `,
  seeAlso: [],
  supportedNodeVersions: [12, 14],
  syncKeywords: true,
}
let inheritedConfig =
  importCwd.silent(rawConfig.name) || require(rawConfig.name)
const mergeOptions = {
  customMerge: key =>
    key === 'supportedNodeVersions' ? (a, b) => b : undefined,
}
if (typeof inheritedConfig === 'function') {
  inheritedConfig = inheritedConfig(
    deepmerge(defaultConfig, rawConfig, mergeOptions)
  )
}

export default deepmerge.all([defaultConfig, inheritedConfig, rawConfig], mergeOptions)
