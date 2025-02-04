import gitHubAction from 'tagged-template-noop';

import cancelExistingSteps from '@/src/get-generated-files/get-github-workflow/steps/cancel-existing.js';
import checkUnknownFilesSteps from '@/src/get-generated-files/get-github-workflow/steps/check-unknown-files.js';
import coverageSteps from '@/src/get-generated-files/get-github-workflow/steps/coverage.js';
import getReleaseSteps from '@/src/get-generated-files/get-github-workflow/steps/get-release.js';
import getTestSteps from '@/src/get-generated-files/get-github-workflow/steps/get-test.js';

export default config => ({
  build: {
    if: "!contains(github.event.head_commit.message, '[skip ci]')",
    'runs-on': 'ubuntu-latest',
    steps: [
      ...cancelExistingSteps,
      {
        uses: gitHubAction`actions/checkout@v4`,
        with: {
          'fetch-depth': 0,
          lfs: true,
          ref: "${{ github.event.pull_request.head.repo.full_name == github.repository && github.event.pull_request.head.ref || '' }}",
        },
      },
      {
        uses: gitHubAction`actions/setup-node@v4`,
        with: { 'check-latest': true, 'node-version': config.nodeVersion },
      },
      { run: 'corepack enable' },
      { run: 'git config --global user.email "actions@github.com"' },
      { run: 'git config --global user.name "GitHub Actions"' },
      { run: 'pnpm install --frozen-lockfile' },
      ...getTestSteps(),
      ...coverageSteps,
      ...checkUnknownFilesSteps,
      ...getReleaseSteps(config),
    ],
  },
});
