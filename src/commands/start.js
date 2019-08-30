const path = require('path')
const { fork } = require('child-process-promise')
const getActiveWorkspacePaths = require('../get-active-workspace-paths')

module.exports = {
  name: 'start',
  description: 'Starts the current workspace',
  handler: () => getActiveWorkspacePaths()
    .then(activeWorkspacePaths => Promise.all(
      activeWorkspacePaths
        .map(workspacePath => fork(
          path.resolve(__dirname, '../run-workspace-command.js'),
          ['start'],
          { stdio: 'inherit', cwd: workspacePath },
        ))
    )),
}
