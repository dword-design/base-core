import P from 'path'
import { copyFile, remove, rename, outputFile, readFile, exists } from 'fs'
import { spawn, fork } from 'child_process'
import chokidar from 'chokidar'
import debounce from 'debounce'
import nodeEnv from 'node-env'
import projectzConfig from './projectz.config'
import safeRequire from 'safe-require'
import getProjectzReadmeSectionRegex from 'get-projectz-readme-section-regex'
import { readFileSync as safeReadFileSync } from 'safe-readfile'
import { filter, join } from '@functions'

export default ({ build: configBuild, start: configStart }) => {

  configBuild = configBuild || (async () => {
    try {
      await spawn('eslint', ['--ext', '.js,.json', '--ignore-path', '.gitignore', '.'], { stdio: 'inherit' })
      await spawn('babel', ['--out-dir', 'dist-new', '--copy-files', 'src'], { stdio: 'inherit' })
      await remove('dist')
      await rename('dist-new', 'dist')
    } catch (error) {
      await remove('dist')
      throw error
    }
  })

  configStart = configStart || (() => chokidar
    .watch('src')
    .on(
      'all',
      debounce(
        async () => {
          try {
            await configBuild()
          } catch (error) {
            if (error.name !== 'ChildProcessError') {
              console.log(error)
            }
          }
        },
        200
      )
    )
  )

  const buildBabelAndEslintFiles = async () => {
    await copyFile(P.resolve(__dirname, 'config-files', 'babelrc'), '.babelrc')
    await copyFile(P.resolve(__dirname, 'config-files', 'eslintrc.json'), '.eslintrc.json')
  }

  const buildFiles = async () => {
    console.log('Copying config files …')
    await copyFile(P.resolve(__dirname, 'config-files', 'editorconfig'), '.editorconfig')
    await copyFile(P.resolve(__dirname, 'config-files', 'gitignore'), '.gitignore')
    await copyFile(P.resolve(__dirname, 'config-files', 'gitpod.yml'), '.gitpod.yml')
    if ((safeRequire(P.join(process.cwd(), 'package.json'))?.license ?? '') !== '') {
      await copyFile(P.resolve(__dirname, 'config-files', 'LICENSE.md'), 'LICENSE.md')
    }
    await copyFile(P.resolve(__dirname, 'config-files', 'renovaterc.json'), '.renovaterc.json')
    await copyFile(P.resolve(__dirname, 'config-files', 'travis.yml'), '.travis.yml')
    await spawn('ajv', ['-s', require.resolve('@dword-design/json-schema-package'), '-d', 'package.json', '--errors', 'text'], { stdio: 'inherit' })
    console.log('Updating README.md …')
    const readmeContent = safeReadFileSync('README.md', 'utf8') ?? ''
    const missingReadmeSections = ['TITLE', 'BADGES', 'DESCRIPTION', 'INSTALL', 'LICENSE']
      |> filter(sectionName => !getProjectzReadmeSectionRegex(sectionName).test(readmeContent))
    if (missingReadmeSections.length > 0) {
      throw new Error(`The README.md file is missing or misses the following sections: ${missingReadmeSections |> join(', ')}`)
    }
    try {
      await outputFile('projectz.json', JSON.stringify(projectzConfig, undefined, 2))
      await spawn('projectz', ['compile'], { capture: ['stdout'] })
    } catch (error) {
      console.log(error.stdout)
      throw error
    } finally {
      await remove('projectz.json')
    }
  }

  const build = async () => {
    await buildBabelAndEslintFiles()
    await buildFiles()
    return configBuild()
  }

  return {
    build: {
      handler: () => build(),
    },
    test: {
      arguments: '[pattern]',
      handler: async pattern => {
        await buildBabelAndEslintFiles()
        if (safeReadFileSync('.gitignore', 'utf8') !== await readFile(P.resolve(__dirname, 'config-files', 'gitignore'), 'utf8')) {
          throw new Error('.gitignore file must be generated. Maybe it has been accidentally modified.')
        }
        if (safeReadFileSync('.gitpod.yml', 'utf8') !== await readFile(P.resolve(__dirname, 'config-files', 'gitpod.yml'), 'utf8')) {
          throw new Error('.gitpod.yml file must be generated. Maybe it has been accidentally modified.')
        }
        if (safeReadFileSync('.renovaterc.json', 'utf8') !== await readFile(P.resolve(__dirname, 'config-files', 'renovaterc.json'), 'utf8')) {
          throw new Error('.renovaterc.json file must be generated. Maybe it has been accidentally modified.')
        }
        if (safeReadFileSync('.travis.yml', 'utf8') !== await readFile(P.resolve(__dirname, 'config-files', 'travis.yml'), 'utf8')) {
          throw new Error('.travis.yml file must be generated. Maybe it has been accidentally modified.')
        }
        if (!await exists('LICENSE.md')
          || !getProjectzReadmeSectionRegex('LICENSEFILE').test(await readFile('LICENSE.md', 'utf8'))
        ) {
          throw new Error('LICENSE.md file must be generated. Maybe it has been accidentally modified.')
        }
        await configBuild()
        await fork(require.resolve('./depcheck.cli'), [])
        if (nodeEnv === 'development') {
          await spawn('install-self', [])
        }
        await spawn(
          'nyc',
          [
            '--reporter', 'lcov',
            '--reporter', 'text',
            '--cwd', process.cwd(),
            'mocha-per-file',
            '--require', require.resolve('./pretest'),
            ...pattern !== undefined ? [pattern] : [],
          ],
          { stdio: 'inherit' }
        )
      },
    },
    start: {
      handler: async () => {
        await buildBabelAndEslintFiles()
        await buildFiles()
        return configStart()
      },
    },
  }
}
