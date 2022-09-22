import { fromPairs, keys, map } from '@dword-design/functions'
import { constantCase } from 'constant-case'
import findUp from 'find-up'
import { existsSync } from 'fs-extra'
import P from 'path'

const envSchemaPath = findUp.sync(path => {
  if (existsSync('.env.schema.json')) {
    return '.env.schema.json'
  }
  if (existsSync(P.join(path, 'package.json'))) {
    return findUp.stop
  }

  return undefined
})

const envVariableNames = [
  ...((envSchemaPath ? require(envSchemaPath) : {})
    |> keys
    |> map(name => `TEST_${name |> constantCase}`)),
  'GH_TOKEN',
]

export default [
  {
    run: 'yarn test',
    ...(envVariableNames.length > 0
      ? {
          env:
            envVariableNames
            |> map(name => [name, `\${{ secrets.${name} }}`])
            |> fromPairs,
        }
      : {}),
  },
  {
    if: 'failure()',
    uses: 'actions/upload-artifact@v3',
    with: {
      name: 'Image Snapshot Diffs',
      path: '**/__image_snapshots__/__diff_output__',
    },
  },
]
