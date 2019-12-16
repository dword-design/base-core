import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child-process-promise'
import outputFiles from 'output-files'
import expect from 'expect'
import glob from 'glob-promise'
import { endent } from '@dword-design/functions'
import { readFile } from 'fs-extra'
import { minimalPackageConfig, minimalProjectConfig, minimalWorkspaceConfig } from '@dword-design/base'
import sortPackageJson from 'sort-package-json'
import P from 'path'

export const it = async () => {

  await withLocalTmpDir(__dirname, async () => {
    await outputFiles({
      ...minimalProjectConfig,
      'package.json': JSON.stringify(sortPackageJson({
        ...minimalPackageConfig,
        private: true,
        workspaces: ['packages/*'],
      }), undefined, 2),
      'packages/a': minimalWorkspaceConfig,
      'packages/b': {
        ...minimalWorkspaceConfig,
        'src/index.js': 'export default 2',
      },
    })
    await spawn('base', ['build'])
    expect(await glob('*', { dot: true })).toEqual([
      '.editorconfig',
      '.gitignore',
      '.gitpod.yml',
      '.renovaterc.json',
      '.travis.yml',
      'LICENSE.md',
      'package.json',
      'packages',
      'README.md',
      'src',
    ])
    expect(await glob('*', { cwd: P.resolve('packages', 'a'), dot: true })).toEqual([
      '.eslintrc.json',
      '.gitignore',
      'dist',
      'LICENSE.md',
      'package.json',
      'README.md',
      'src',
    ])
    expect(await glob('*', { cwd: P.resolve('packages', 'b'), dot: true })).toEqual([
      '.eslintrc.json',
      '.gitignore',
      'dist',
      'LICENSE.md',
      'package.json',
      'README.md',
      'src',
    ])
    expect(require(P.resolve('packages', 'a', 'dist'))).toEqual(1)
    expect(require(P.resolve('packages', 'b', 'dist'))).toEqual(2)
    expect(await readFile('README.md', 'utf8')).toEqual(endent`
      <!-- TITLE/ -->

      <h1>foo</h1>

      <!-- /TITLE -->


      <!-- BADGES/ -->

      <span class="badge-npmversion"><a href="https://npmjs.org/package/foo" title="View this project on NPM"><img src="https://img.shields.io/npm/v/foo.svg" alt="NPM version" /></a></span>
      <span class="badge-travisci"><a href="http://travis-ci.org/bar/foo" title="Check this project's build status on TravisCI"><img src="https://img.shields.io/travis/bar/foo/master.svg" alt="Travis CI Build Status" /></a></span>
      <span class="badge-coveralls"><a href="https://coveralls.io/r/bar/foo" title="View this project's coverage on Coveralls"><img src="https://img.shields.io/coveralls/bar/foo.svg" alt="Coveralls Coverage Status" /></a></span>
      <span class="badge-daviddm"><a href="https://david-dm.org/bar/foo" title="View the status of this project's dependencies on DavidDM"><img src="https://img.shields.io/david/bar/foo.svg" alt="Dependency Status" /></a></span>
      <span class="badge-shields"><a href="https://img.shields.io/badge/renovate-enabled-brightgreen.svg"><img src="https://img.shields.io/badge/renovate-enabled-brightgreen.svg" /></a></span>

      <!-- /BADGES -->


      <!-- DESCRIPTION/ -->

      This is a test package.

      <!-- /DESCRIPTION -->


      <!-- INSTALL/ -->

      <h2>Install</h2>

      <a href="https://npmjs.com" title="npm is a package manager for javascript"><h3>npm</h3></a>
      <ul>
      <li>Install: <code>npm install --save foo</code></li>
      <li>Require: <code>require('foo')</code></li>
      </ul>

      <!-- /INSTALL -->


      <!-- LICENSE/ -->

      <h2>License</h2>

      Unless stated otherwise all works are:

      <ul><li>Copyright &copy; bar</li></ul>

      and licensed under:

      <ul><li><a href="http://spdx.org/licenses/MIT.html">MIT License</a></li></ul>

      <!-- /LICENSE -->
    ` + '\n')
    expect(await readFile('LICENSE.md', 'utf8')).toMatch('MIT License')
  })
}

export const timeout = 25000
