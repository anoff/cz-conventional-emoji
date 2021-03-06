const readPkg = require('read-pkg-up')
const wrap = require('wrap-ansi')
let types = require('./lib/types')
const loadConfig = require('./lib/load-config')

function createQuestions (res) {
  const config = loadConfig(res)
  // use types from config otherwise default
  types = config.types ? config.types : types
  // transform ton inquirer format
  const choices = Object.keys(types).map(elm => {
    const type = types[elm]
    return {
      name: type.description,
      value: {
        emoji: type.emoji,
        string: elm
      }
    }
  })
  let q = [
    {
      type: 'list',
      name: 'type',
      message: 'Select the type of change you\'re committing',
      choices: choices
    },
    {
      type: config.scopes ? 'list' : 'input',
      name: 'scope',
      message: 'Specify a scope',
      choices: config.scopes && [{name: '[none]', value: ''}].concat(config.scopes)
    },
    {
      type: 'input',
      name: 'subject',
      message: 'Short description'
    },
    {
      type: 'input',
      name: 'issues',
      message: 'Affected issues'
    },
    {
      type: 'input',
      name: 'body',
      message: 'Longer description'
    }
  ]
  // use just type and short description in 'quick' mode
  if (config.quick) {
    q = [q[0], q[2]]
  }
  return q
}

function format (answers) {
  // parentheses are only needed when a scope is present
  const scope = answers.scope ? '(' + answers.scope.trim() + '): ' : ': '

  // build head line and limit it to 100
  const head = (answers.type.emoji + ' ' + answers.type.string + scope + answers.subject.trim()).slice(0, 100)

  // wrap body at 100
  const body = answers.body ? wrap(answers.body, 100) : ''

  // build issue
  const issues = answers.issues ? '\n\n' + answers.issues : ''

  return (head + '\n\n' + body + issues)
}

module.exports = {
  prompter: function (cz, commit) {
    readPkg()
      .then(createQuestions)
      .then(cz.prompt)
      .then(format)
      .then(commit)
  },
  module: function (config) {
    return {
      prompter: function (cz, commit) {
        Promise.resolve(createQuestions(config))
          .then(cz.prompt)
          .then(format)
          .then(commit)
      }
    }
  }
}
