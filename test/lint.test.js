const outputFiles = require('output-files')
const endent = require('endent')
const { lint } = require('this')
const expect = require('expect')
const testWithLogging = require('./test-with-logging')
const chalk = require('chalk')
const { resolve } = require('path')

describe('lint', () => {

  it('throws error if no lang exists', () => testWithLogging(async log => {
    await outputFiles('.', {
      'package.json': JSON.stringify({
        dependencies: {
          'change-case': '0.1.0',
        },
      }),
    })
    await expect(lint({ log })).rejects.toThrow()
  }))

  it('linting fails', () => testWithLogging({
    callback: async log => {
      await outputFiles('.', {
        'package.json': JSON.stringify({
          dependencies: {
            'base-lang-standard': '0.1.0',
          },
        }),
        src: {
          'index.js': "console.log('foo');",
        },
        node_modules: {
          'base-lang-standard': {
            'index.js': endent`
              module.exports = {
                eslintConfig: {
                  "rules": {
                    "semi": ["error", "never"],
                  },
                },
              }
            `,
          }
        }
      })
      await lint({ log })//.rejects.toThrow()
    },
    logOutput: () => chalk.reset('\n' + endent`
      ${chalk.underline(resolve('src', 'index.js'))}
        ${chalk.dim('1:19')}  ${chalk.red('error')}  Extra semicolon  ${chalk.dim('semi')}

      ${chalk.red.bold('\u2716 1 problem (1 error, 0 warnings)')}
      ${chalk.red.bold('  1 error and 0 warnings potentially fixable with the `--fix` option.')}
    `),
  }))

  it('linting passes', () => testWithLogging({
    callback: async log => {
      await outputFiles('.', {
        'package.json': JSON.stringify({
          dependencies: {
            'base-lang-standard': '0.1.0',
          },
        }),
        src: {
          'index.js': "console.log('foo')",
        },
        node_modules: {
          'base-lang-standard': {
            'index.js': endent`
              module.exports = {
                eslintConfig: {
                  "rules": {
                    "semi": ["error", "never"],
                  },
                },
              }
            `,
          }
        }
      })
      await lint({ log })
    },
    logOutput: '\n',
  }))
})
