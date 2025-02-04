import { map } from '@dword-design/functions';
import gitHubAction from 'tagged-template-noop';

import cancelExistingSteps from '@/src/get-generated-files/get-github-workflow/steps/cancel-existing.js';
import checkUnknownFilesSteps from '@/src/get-generated-files/get-github-workflow/steps/check-unknown-files.js';
import coverageSteps from '@/src/get-generated-files/get-github-workflow/steps/coverage.js';
import getReleaseSteps from '@/src/get-generated-files/get-github-workflow/steps/get-release.js';
import getTestSteps from '@/src/get-generated-files/get-github-workflow/steps/get-test.js';

export default config => ({
  'cancel-existing': {
    if: "!contains(github.event.head_commit.message, '[skip ci]')",
    'runs-on': 'ubuntu-latest',
    steps: cancelExistingSteps,
  },
  release: {
    needs: 'test',
    'runs-on': 'ubuntu-latest',
    steps: [
      {
        uses: gitHubAction`actions/checkout@v4`,
        with: {
          lfs: true,
          ref: "${{ github.event.pull_request.head.repo.full_name == github.repository && github.event.pull_request.head.ref || '' }}",
        },
      },
      {
        uses: gitHubAction`actions/setup-node@v4`,
        with: { 'node-version': config.nodeVersion },
      },
      { run: 'corepack enable' },
      { run: 'git config --global user.email "actions@github.com"' },
      { run: 'git config --global user.name "GitHub Actions"' },
      { run: 'pnpm install --frozen-lockfile' },
      ...checkUnknownFilesSteps,
      { run: 'pnpm lint' },
      ...getReleaseSteps(config),
    ],
  },
  test: {
    needs: 'cancel-existing',
    'runs-on': '${{ matrix.os }}',
    steps: [
      {
        uses: gitHubAction`actions/checkout@v4`,
        with: { 'fetch-depth': 0, lfs: true },
      },
      {
        uses: gitHubAction`actions/setup-node@v4`,
        with: { 'check-latest': true, 'node-version': '${{ matrix.node }}' },
      },
      { run: 'corepack enable' },
      { run: 'pnpm install --frozen-lockfile' },
      ...getTestSteps(),
      ...(coverageSteps
        |> map(step => ({
          if: `matrix.os == 'ubuntu-latest' && matrix.node == ${config.nodeVersion}`,
          ...step,
        }))),
    ],
    strategy: {
      matrix: {
        include: [
          ...config.supportedNodeVersions.map(version => ({
            node: version,
            os: 'ubuntu-latest',
          })),
          ...(config.macos
            ? [{ node: config.nodeVersion, os: 'macos-latest' }]
            : []),
          ...(config.windows
            ? [{ node: config.nodeVersion, os: 'windows-latest' }]
            : []),
        ],
      },
    },
  },
});
