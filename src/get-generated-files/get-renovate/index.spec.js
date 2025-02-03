import dotenv from '@dword-design/dotenv-json-extended';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import { execa, execaCommand } from 'execa';
import fs from 'fs-extra';

import { Base } from '@/src/index.js';

dotenv.config();

export default tester(
  {
    'custom config': () =>
      expect(
        new Base({ renovateConfig: { foo: 'bar' } }).getRenovateConfig().foo,
      ).toEqual('bar'),
    'custom config array': () =>
      expect(
        new Base({ renovateConfig: { labels: ['foo'] } }).getRenovateConfig()
          .labels,
      ).toEqual(['maintenance', 'foo']),
    'github action': async () => {
      await execaCommand('git init');
      await execaCommand('git config user.email "foo@bar.de"');
      await execaCommand('git config user.name "foo"');
      await fs.outputFile('index.js', 'gitHubAction`actions/checkout@v4`');
      const base = new Base();
      await base.prepare();
      await execaCommand('git add .');
      await execa('git', ['commit', '-m', 'feat: init']);

      const output = (
        await execaCommand(
          `renovate --platform=local --dry-run --host-rules=[{matchHost:'api.github.com',hostType:'github',token:'${process.env.RENOVATE_GITHUB_PERSONAL_ACCESS_TOKEN}'}] --cache-dir .`,
          { env: { LOG_LEVEL: 'debug' } },
        )
      ).stdout;

      expect(output).toMatch(/renovate\/actions-checkout-\d+\.x/);
    },
    'lock file': async () => {
      await execaCommand('git init');
      await execaCommand('git config user.email "foo@bar.de"');
      await execaCommand('git config user.name "foo"');

      await fs.outputFile(
        'package.json',
        JSON.stringify({ dependencies: { globby: '^13.0.0' } }),
      );

      await execaCommand('pnpm install');
      const base = new Base();
      await base.prepare();
      await execaCommand('git add .');
      await execa('git', ['commit', '-m', 'feat: init']);

      const output = (
        await execaCommand('renovate --platform=local --dry-run', {
          env: { LOG_LEVEL: 'debug' },
        })
      ).stdout;

      expect(output).toMatch('chore: lock file maintenance');
    },
    'lock file fix commit type': async () => {
      await execaCommand('git init');
      await execaCommand('git config user.email "foo@bar.de"');
      await execaCommand('git config user.name "foo"');

      await fs.outputFile(
        'package.json',
        JSON.stringify({ dependencies: { globby: '^13.0.0' } }),
      );

      await execaCommand('pnpm install');
      const base = new Base({ isLockFileFixCommitType: true });
      await base.prepare();
      await execaCommand('git add .');
      await execa('git', ['commit', '-m', 'feat: init']);

      const output = (
        await execaCommand('renovate --platform=local --dry-run', {
          env: { LOG_LEVEL: 'debug' },
        })
      ).stdout;

      expect(output).toMatch('fix: lock file maintenance');
    },
    'nodejs version': async () => {
      await execaCommand('git init');
      await execaCommand('git config user.email "foo@bar.de"');
      await execaCommand('git config user.name "foo"');
      await fs.outputFile('index.js', 'nodejsVersion`18`');
      const base = new Base();
      await base.prepare();
      await execaCommand('git add .');
      await execa('git', ['commit', '-m', 'feat: init']);

      const output = (
        await execaCommand('renovate --platform=local --dry-run', {
          env: { LOG_LEVEL: 'debug' },
        })
      ).stdout;

      expect(output).toMatch(/renovate\/node-\d+\.x/);
    },
    'outdated version in package.json': async () => {
      await execaCommand('git init');
      await execaCommand('git config user.email "foo@bar.de"');
      await execaCommand('git config user.name "foo"');

      await fs.outputFile(
        'package.json',
        JSON.stringify({ dependencies: { globby: '^13.0.0' } }),
      );

      const base = new Base();
      await base.prepare();
      await execaCommand('git add .');
      await execa('git', ['commit', '-m', 'feat: init']);

      const output = (
        await execaCommand('renovate --platform=local', {
          env: { LOG_LEVEL: 'debug' },
        })
      ).stdout;

      expect(output).toMatch(/renovate\/globby-\d+\.x/);
    },
  },
  [testerPluginTmpDir()],
);
