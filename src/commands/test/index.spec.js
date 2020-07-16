import {
  endent,
  identity,
  mapValues,
  noop,
  property,
  sortBy,
} from '@dword-design/functions'
import execa from 'execa'
import globby from 'globby'
import outputFiles from 'output-files'
import stealthyRequire from 'stealthy-require'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => {
  config = { arguments: [], files: {}, test: noop, ...config }
  return () =>
    withLocalTmpDir(async () => {
      await outputFiles(config.files)
      const prepare = stealthyRequire(require.cache, () =>
        require('../prepare')
      )
      await prepare()
      let output
      try {
        output =
          execa(require.resolve('../../cli'), ['test', ...config.arguments], {
            all: true,
          })
          |> await
          |> property('all')
      } catch (error) {
        output = error.all
      }
      await config.test(output)
    })
}

export default {
  assertion: {
    files: {
      src: {
        'index.js': 'export default 1',
        'index.spec.js': endent`
        export default {
          valid: () => expect(1).toEqual(2),
        }
      `,
      },
    },
    test: output =>
      expect(output).toMatch('Error: expect(received).toEqual(expected)'),
  },
  'bin outside dist': {
    files: {
      'package.json': JSON.stringify(
        { bin: { foo: './src/cli.js' } },
        undefined,
        2
      ),
    },
    test: output =>
      expect(output).toMatch("data.bin['foo'] should match pattern"),
  },
  'config file errors': {
    files: {
      'package.json': JSON.stringify({ name: '_foo' }, undefined, 2),
    },
    test: output => expect(output).toMatch('package.json invalid'),
  },
  empty: {},
  grep: {
    arguments: ['--grep', 'foo'],
    files: {
      src: {
        'index.js': 'export default 1',
        'index.spec.js': endent`
        export default {
          bar: () => console.log('run bar'),
          foo: () => console.log('run foo'),
        }
      `,
      },
    },
    test: output => {
      expect(output).not.toMatch('run bar')
      expect(output).toMatch('run foo')
    },
  },
  'invalid name': {
    files: {
      'package.json': JSON.stringify({ name: '_foo' }, undefined, 2),
    },
    test: output => expect(output).toMatch('data.name should match pattern'),
  },
  'json errors': {
    files: {
      'src/test.json': 'foo bar',
    },
    test: output => expect(output).toMatch('error  Unexpected token o'),
  },
  'linting errors': {
    files: {
      'src/index.js': "var foo = 'bar'",
    },
    test: output =>
      expect(output).toMatch(
        "error  'foo' is assigned a value but never used  no-unused-vars"
      ),
  },
  minimal: {
    files: {
      'src/index.js': 'export default 1',
    },
  },
  'missing readme sections': {
    files: {
      'README.md': endent`
        <!-- TITLE -->
    
        <!-- BADGES -->
    
        <!-- LICENSE -->
    
      `,
    },
    test: output =>
      expect(output).toEqual(
        'The README.md file is missing or misses the following sections: DESCRIPTION, INSTALL'
      ),
  },
  pattern: {
    arguments: ['src/index2.spec.js'],
    files: {
      'README.md': '',
      'package.json': JSON.stringify(
        {
          dependencies: {
            foo: '^1.0.0',
          },
        },
        undefined,
        2
      ),
      src: {
        'index.js': 'export default 1',
        'index1.spec.js':
          "export default { valid: () => console.log('run index1') }",
        'index2.spec.js':
          "export default { valid: () => console.log('run index2') }",
      },
    },
    test: output => {
      expect(output).not.toMatch('run index1')
      expect(output).toMatch('run index2')
    },
  },
  'prod dependency only in test': {
    files: {
      'node_modules/bar/index.js': 'export default 1',
      'package.json': JSON.stringify(
        {
          dependencies: {
            bar: '^1.0.0',
          },
        },
        undefined,
        2
      ),
      src: {
        'index.js': 'export default 1',
        'index.spec.js': endent`
        import bar from 'bar'
  
        export default bar
      `,
      },
    },
    test: output =>
      expect(output).toMatch(endent`
      Unused dependencies
      * bar
    `),
  },
  'test in project root': {
    files: {
      'index.spec.js': endent`
        export default {
          valid: () => console.log('run test')
        }

      `,
      'node_modules/base-config-foo/index.js': endent`
        module.exports = {
          allowedMatches: [
            'index.spec.js',
          ],
        }
      `,
      'package.json': JSON.stringify(
        {
          baseConfig: 'foo',
        },
        undefined,
        2
      ),
    },
    test: output => expect(output).toMatch('run test'),
  },
  'unstable version': {
    files: {
      'package.json': JSON.stringify({ version: '0.1.0' }, undefined, 2),
    },
    test: output => expect(output).toMatch('data.version should match pattern'),
  },
  'unused dependecy': {
    files: {
      'package.json': JSON.stringify(
        {
          dependencies: {
            'change-case': '^1.0.0',
          },
        },
        undefined,
        2
      ),
      'src/index.js': 'export default 1',
    },
    test: output =>
      expect(output).toMatch(endent`
      Unused dependencies
      * change-case
    `),
  },
  valid: {
    files: {
      'package.json': JSON.stringify(
        {
          name: 'foo',
        },
        undefined,
        2
      ),
      src: {
        'index.js': endent`
          export default 1
          
        `,
        'index.spec.js': endent`
          import foo from '.'
    
          export default {
            valid: () => {
              expect(process.env.NODE_ENV).toEqual('test')
              expect(foo).toEqual(1)
              console.log('run test')
            },
          }
          
        `,
      },
    },
    test: async output => {
      expect(output.all).toMatch('run test')
      expect(
        globby('*', { dot: true, onlyFiles: false })
          |> await
          |> sortBy(identity)
      ).toEqual([
        '.babelrc.json',
        '.cz.json',
        '.editorconfig',
        '.eslintrc.json',
        '.gitattributes',
        '.github',
        '.gitignore',
        '.gitpod.Dockerfile',
        '.gitpod.yml',
        '.nyc_output',
        '.releaserc.json',
        '.renovaterc.json',
        '.vscode',
        'LICENSE.md',
        'README.md',
        'coverage',
        'node_modules',
        'package.json',
        'src',
      ])
    },
  },
  'wrong dependencies type': {
    files: {
      'package.json': JSON.stringify(
        {
          dependencies: 1,
        },
        undefined,
        2
      ),
    },
    test: output =>
      expect(output).toMatch('data.dependencies should be object'),
  },
  'wrong description type': {
    files: {
      'package.json': JSON.stringify(
        {
          description: 1,
        },
        undefined,
        2
      ),
    },
    test: output => expect(output).toMatch('data.description should be string'),
  },
  'wrong dev dependencies type': {
    files: {
      'package.json': JSON.stringify({ devDependencies: 1 }, undefined, 2),
    },
    test: output =>
      expect(output).toMatch('data.devDependencies should be object'),
  },
  'wrong keywords type': {
    files: {
      'package.json': JSON.stringify({ keywords: 1 }, undefined, 2),
    },
    test: output => expect(output).toMatch('data.keywords should be array'),
  },
} |> mapValues(runTest)
