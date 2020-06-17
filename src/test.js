import { endent, filter, join, map, property } from '@dword-design/functions'
import { isCI } from '@qawolf/ci-info'
import execa from 'execa'
import getProjectzReadmeSectionRegex from 'get-projectz-readme-section-regex'
import globby from 'globby'
import isDocker from 'is-docker'
import isGitpod from 'is-gitpod'
import loadPkg from 'load-pkg'
import promiseSequential from 'promise-sequential'
import { readFileSync as safeReadFileSync } from 'safe-readfile'

import config from './config'
import lint from './lint'

const workspaceDepcheck = async workspace => {
  try {
    await execa(
      'depcheck',
      [
        '--skip-missing',
        true,
        '--config',
        require.resolve('./depcheck.config'),
        '.',
      ],
      { all: true, cwd: workspace }
    )
  } catch (error) {
    const workspaceName =
      loadPkg({ cwd: workspace }) |> await |> property('name')
    throw new Error(endent`
      Error in ${workspaceName}:
      ${error.all}
    `)
  }
}

export default async (pattern, options) => {
  try {
    await execa(
      'ajv',
      [
        '-s',
        require.resolve('./package-json-schema.config'),
        '-d',
        'package.json',
        '--errors',
        'text',
      ],
      { all: true }
    )
  } catch (error) {
    throw new Error(error.all)
  }
  const readmeContent = safeReadFileSync('README.md', 'utf8') || ''
  const missingReadmeSections =
    ['TITLE', 'BADGES', 'DESCRIPTION', 'INSTALL', 'LICENSE']
    |> filter(
      sectionName =>
        !getProjectzReadmeSectionRegex(sectionName).test(readmeContent)
    )
  if (missingReadmeSections.length > 0) {
    throw new Error(
      `The README.md file is missing or misses the following sections: ${
        missingReadmeSections |> join(', ')
      }`
    )
  }
  await lint()
  try {
    await execa(
      'depcheck',
      [
        '--skip-missing',
        true,
        '--config',
        require.resolve(
          `./depcheck${config.packageConfig?.workspaces ? '.root' : ''}.config`
        ),
        '.',
      ],
      { all: true }
    )
  } catch (error) {
    throw new Error(error.all)
  }
  if (config.packageConfig?.workspaces) {
    await (globby(config.packageConfig.workspaces, { onlyDirectories: true })
      |> await
      |> map(workspace => () => workspaceDepcheck(workspace))
      |> promiseSequential)
  }
  if (!config.testInContainer || isCI || isDocker() || (await isGitpod())) {
    return execa(
      'nyc',
      [
        '--reporter',
        'lcov',
        '--reporter',
        'text',
        '--cwd',
        process.cwd(),
        '--require',
        require.resolve('./pretest'),
        '--all',
        '--include',
        '**/*.js',
        '--exclude',
        '**/*.spec.js',
        '--exclude',
        'coverage/**',
        '--exclude',
        'tmp-*/**',
        '--exclude',
        'dist/**',
        'mocha',
        '--ui',
        'exports-auto-describe',
        '--file',
        require.resolve('./setup-test'),
        '--timeout',
        80000,
        ...(options.grep ? ['--grep', options.grep] : []),
        ...(process.platform === 'win32' ? ['--exit'] : []),
        ...(pattern ? [pattern] : ['{,!(node_modules)/**/}*.spec.js']),
      ],
      { stdio: 'inherit' }
    )
  }
  throw new Error(
    'This project can only be tested inside of a container. Please consider to test it in a docker container or in GitPod.'
  )
}
