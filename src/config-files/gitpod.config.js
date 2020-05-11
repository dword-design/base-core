import { endent } from '@dword-design/functions'

export default endent`
  image:
    file: .gitpod.Dockerfile
    
  tasks:
    - init: echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" >>~/.npmrc
    - init: yarn --frozen-lockfile

  vscode:
    extensions:
      - karlito40.fix-irregular-whitespace@0.0.3:8jjyZYuYF6yW6nwsAiulrg==
`
