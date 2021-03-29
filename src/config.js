import { endent, identity } from '@dword-design/functions'
import depcheck from 'depcheck'
import depcheckDetectorExeca from 'depcheck-detector-execa'
import depcheckDetectorPackageName from 'depcheck-detector-package-name'
import depcheckParserBabel from 'depcheck-parser-babel'
import importCwd from 'import-cwd'

import depcheckSpecialBaseConfig from './depcheck-special-base-config'
import packageBaseConfig from './package-base-config'
import packageConfig from './package-config'

const baseConfig = importCwd(packageBaseConfig.name)

export default {
  allowedMatches: [],
  commands: {},
  deployAssets: [],
  deployEnv: {},
  deployPlugins: [],
  editorIgnore: [],
  gitignore: [],
  lint: identity,
  nodeVersion: 12,
  preDeploySteps: [],
  prepare: identity,
  readmeInstallString: endent`
    ## Install

    \`\`\`bash
    # npm
    $ npm install ${packageBaseConfig.global ? '-g ' : ''}${packageConfig.name}

    # Yarn
    $ yarn ${packageBaseConfig.global ? 'global ' : ''}add ${packageConfig.name}
    \`\`\`
  `,
  ...baseConfig,
  ...packageBaseConfig,
  depcheckConfig: {
    ignoreDirs: ['.nyc_output', '.vscode', 'coverage', 'dist', '.nuxt'],
    ignores:
      (typeof baseConfig === 'string'
        ? undefined
        : packageBaseConfig.depcheckConfig?.ignoreMatches) || [],
    prodDependencyMatches: ['!**/*.spec.js'],
    ...baseConfig.depcheckConfig,
    detectors: [
      depcheck.detector.importDeclaration,
      depcheck.detector.requireCallExpression,
      depcheck.detector.requireResolveCallExpression,
      depcheckDetectorExeca,
      depcheckDetectorPackageName,
      ...(baseConfig.depcheckConfig?.detectors || []),
    ],
    parsers: {
      '*.js': depcheckParserBabel,
      ...baseConfig.depcheckConfig?.parsers,
    },
    specials: [
      depcheckSpecialBaseConfig,
      depcheck.special.bin,
      ...(baseConfig.depcheckConfig?.specials || []),
    ],
  },
}
