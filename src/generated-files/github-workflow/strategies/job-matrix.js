import { map } from '@dword-design/functions'

import cancelExistingSteps from '@/src/generated-files/github-workflow/steps/cancel-existing'
import coverageSteps from '@/src/generated-files/github-workflow/steps/coverage'
import releaseSteps from '@/src/generated-files/github-workflow/steps/release'
import testSteps from '@/src/generated-files/github-workflow/steps/test'

export default {
  jobs: {
    'cancel-existing': {
      'runs-on': 'ubuntu-latest',
      steps: cancelExistingSteps,
    },
    release: {
      if: "github.ref == 'refs/heads/master'",
      needs: 'test',
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: 'actions/checkout@v2' },
        {
          uses: 'actions/setup-node@v1',
          with: {
            'node-version': 12,
          },
        },
        { run: 'git config --global user.email "actions@github.com"' },
        { run: 'git config --global user.name "GitHub Actions"' },
        { run: 'yarn --frozen-lockfile' },
        { run: 'yarn clean' },
        { run: 'yarn lint' },
        ...releaseSteps,
      ],
    },
    test: {
      needs: 'cancel-existing',
      'runs-on': '${{ matrix.os }}',
      steps: [
        { uses: 'actions/checkout@v2' },
        {
          uses: 'actions/setup-node@v1',
          with: {
            'node-version': '${{ matrix.node }}',
          },
        },
        { run: 'git config --global user.email "actions@github.com"' },
        { run: 'git config --global user.name "GitHub Actions"' },
        { run: 'yarn --frozen-lockfile' },
        ...testSteps,
        ...(coverageSteps
          |> map(step => ({
            if: "matrix.os == 'ubuntu-latest' && matrix.node == 12",
            ...step,
          }))),
      ],
      strategy: {
        matrix: {
          exclude: [
            { node: 10, os: 'macos-latest' },
            { node: 10, os: 'windows-latest' },
          ],
          node: [10, 12],
          os: ['macos-latest', 'windows-latest', 'ubuntu-latest'],
        },
      },
    },
  },
  name: 'build',
  on: {
    push: {
      branches: ['**'],
    },
  },
}
