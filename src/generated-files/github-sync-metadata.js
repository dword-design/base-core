import config from '@/src/config'

export default {
  jobs: {
    build: {
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: 'actions/checkout@v3' },
        {
          uses: 'jaid/action-sync-node-meta@v2.0.0',
          with: {
            approve: false,
            ...(!config.syncKeywords && { syncKeywords: false }),
            commitMessage:
              'fix: write GitHub metadata to package.json [{changes}]',
            githubToken: '${{ secrets.GITHUB_TOKEN }}',
          },
        },
      ],
    },
  },
  name: 'sync-metadata',
  on: {
    schedule: [{ cron: '0 5 * * *' }],
    workflow_dispatch: {},
  },
}
