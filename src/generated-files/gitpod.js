export default {
  image: { file: '.gitpod.Dockerfile' },
  tasks: [
    { before: 'sudo docker-up', name: 'Docker Deamon' },
    {
      init: 'gitpod-env-per-project && git lfs pull && echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >>~/.npmrc && yarn --frozen-lockfile',
    },
  ],
  vscode: {
    extensions: [
      'karlito40.fix-irregular-whitespace@0.0.3:8jjyZYuYF6yW6nwsAiulrg==',
      'adrianwilczynski.toggle-hidden@1.0.2:pj4yxebPvdfdMeVIjOEuRQ==',
    ],
  },
}
