import { keys, first, endent } from '@dword-design/functions'
import ci from '@dword-design/ci/package.json'

const bin = ci.bin |> keys |> first

export default endent`
  name: Node.js CI

  on:
    push:
      branches:
        - '**'

  jobs:
    test:
      runs-on: \${{ matrix.os }}
      strategy:
        matrix:
          os: [macos-latest, windows-latest, ubuntu-latest]
          node: [10, 12]
          exclude:
            - os: macos-latest
              node: 10
            - os: windows-latest
              node: 10
      steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v1
          with:
            node-version: \${{ matrix.node }}
        - run: yarn --frozen-lockfile
        - run: yarn test
        - name: Coveralls
          run: yarn ${bin} coveralls
          env:
            COVERALLS_REPO_TOKEN: \${{ secrets.GITHUB_TOKEN }}
            COVERALLS_SERVICE_NAME: github
            COVERALLS_GIT_COMMIT: \${{ github.sha }}
            COVERALLS_GIT_BRANCH: \${{ github.ref }}

    release:
      needs: test
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - uses: actions/setup-node@v1
          with:
            node-version: 12
        - run: yarn
        - name: Push changed files
          run: yarn ${bin} push-changed-files
          env:
            GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
            GITHUB_REPOSITORY: \${{ secrets.GITHUB_REPOSITORY }}
        - name: Release
          env:
            GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
            NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
          run: |
            yarn semantic-release
`