export default {
  image: { file: '.gitpod.Dockerfile' },
  tasks: [
    { before: 'sudo docker-up', name: 'Docker Deamon' },
    {
      init: 'eval $(gitpod-env-per-project) && git lfs pull && yarn --frozen-lockfile',
    },
  ],
  vscode: {
    extensions: [
      'karlito40.fix-irregular-whitespace@0.0.3:8jjyZYuYF6yW6nwsAiulrg==',
      'https://dl.dropboxusercontent.com/s/efgfn4jj6ju394a/adrianwilczynski.toggle-hidden-1.0.2.vsix',
      'octref.vetur@0.33.1',
    ],
  },
}
