import { endent } from '@dword-design/functions';
import * as personalData from '@dword-design/personal-data';
import parsePackagejsonName from 'parse-packagejson-name';

export default function () {
  const packageName = parsePackagejsonName(this.packageConfig.name).fullName;
  return {
    image: { file: '.gitpod.Dockerfile' },
    tasks: [
      {
        // puppeteer by default installs Chromium in the home folder, but since GitPod does not preserve the home folder
        // after restarts, we need to store it in the workspace folder
        // https://www.gitpod.io/docs/configure/workspaces/workspace-lifecycle#workspace-stopped
        before: endent`
          echo "corepack enable" >> /home/gitpod/.bashrc
          echo "export COREPACK_ENABLE_DOWNLOAD_PROMPT=0" >> /home/gitpod/.bashrc
          gitpod-env-per-project >> /home/gitpod/.bashrc
          echo "export PUPPETEER_CACHE_DIR=/workspace/${packageName}/node_modules/.cache/puppeteer" >> /home/gitpod/.bashrc
          echo "export PLAYWRIGHT_BROWSERS_PATH=0" >> /home/gitpod/.bashrc
          source /home/gitpod/.bashrc
        `,
        init: endent`
          git config --global user.name "${personalData.name}"
          git config diff.lfs.textconv cat
          git lfs pull
          pnpm install --frozen-lockfile
        `,
      },
    ],
    vscode: {
      extensions: [
        'https://sebastianlandwehr.com/vscode-extensions/karlito40.fix-irregular-whitespace-0.1.1.vsix',
        'https://sebastianlandwehr.com/vscode-extensions/adrianwilczynski.toggle-hidden-1.0.2.vsix',
        'octref.vetur@0.33.1',
        'Tobermory.es6-string-html',
        'zjcompt.es6-string-javascript',
      ],
    },
  };
}
