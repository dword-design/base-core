import {
  filter,
  flatMap,
  join,
  keys,
  map,
  replace,
} from '@dword-design/functions';
import { constantCase } from 'change-case';
import { execa } from 'execa';
import { findUpSync } from 'find-up';
import fs from 'fs-extra';
import os from 'os';

export default async function (options) {
  options = { log: true, patterns: [], ...options };

  const volumeName =
    this.packageConfig.name |> replace('@', '') |> replace('/', '-');

  const envSchemaPath = findUpSync('.env.schema.json');

  const envVariableNames =
    (envSchemaPath ? await fs.readJson(envSchemaPath) : {})
    |> keys
    |> map(name => `TEST_${name |> constantCase}`);

  const userInfo = os.userInfo();

  try {
    return await execa(
      'docker',
      [
        'run',
        '--rm',
        ...(envVariableNames
          |> filter(name => process.env[name] !== undefined)
          |> flatMap(name => ['--env', `${name}=${process.env[name]}`])),
        '-v',
        `${process.cwd()}:/app`,
        '-v',
        `${volumeName}:/app/node_modules`,
        'dworddesign/testing:latest',
        'bash',
        '-c',
        [
          'pnpm install --frozen-lockfile',
          '&&',
          'pnpm test:raw',
          ...(options.updateSnapshots ? [' --update-snapshots'] : []),
          ...options.patterns.map(pattern => `"${pattern}"`),
          ...(options.grep ? [`-g "${options.grep}"`] : []),
        ] |> join(' '),
      ],
      options.log ? { stdio: 'inherit' } : { all: true },
    );
  } finally {
    await execa('docker', [
      'run',
      '--rm',
      '--tty',
      '-v',
      `${process.cwd()}:/app`,
      '-v',
      `${volumeName}:/app/node_modules`,
      'dworddesign/testing:latest',
      'bash',
      '-c',
      `chown -R ${userInfo.uid}:${userInfo.gid} /app`,
    ]);
  }
}
