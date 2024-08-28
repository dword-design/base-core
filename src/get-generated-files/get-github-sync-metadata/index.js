import gitHubAction from 'tagged-template-noop';

export default function () {
  return {
    jobs: {
      build: {
        'runs-on': 'ubuntu-latest',
        steps: [
          { uses: gitHubAction`actions/checkout@v4` },
          {
            uses: gitHubAction`jaid/action-sync-node-meta@v2.0.0`,
            with: {
              approve: false,
              ...(!this.config.syncKeywords && { syncKeywords: false }),
              commitMessage:
                'fix: write GitHub metadata to package.json [{changes}]',
              githubToken: '${{ secrets.GITHUB_TOKEN }}',
            },
          },
          { uses: gitHubAction`gautamkrishnar/keepalive-workflow@v2` },
        ],
      },
    },
    name: 'sync-metadata',
    on: { schedule: [{ cron: '0 5 * * *' }], workflow_dispatch: {} },
  };
}
