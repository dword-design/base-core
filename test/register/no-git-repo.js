import withLocalTmpDir from 'with-local-tmp-dir'
import { spawn } from 'child_process'
import resolveBin from 'resolve-bin'
import expect from 'expect'

export const it = () => withLocalTmpDir(__dirname, async () => {
  const { stdout } = await spawn(
    resolveBin.sync('@dword-design/base', { executable: 'base' }),
    ['register'],
    { capture: ['stdout'] }
  )
  expect(stdout).toEqual('')
})
export const timeout = 20000
