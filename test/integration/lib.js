'use strict';

const { spawn, execSync } = require('child_process');
const { concat, filter, isEmpty, not } = require('ramda');
const { resolve, join } = require('path');

const { copyFileSync } = require('fs');

/**
 * Runs serverless
 *
 * @param parameters
 * @returns {Promise->string} - std out and std error
 */
async function sls(parameters) {
  return new Promise((resolve, reject) => {
    const run = filter(parameter => not(isEmpty(parameter)), concat(['sls'], parameters));
    const serverless = spawn('npx', run);
    let output = '';
    serverless.stdout.on('data', data => {
      output += data.toString();
    });

    serverless.stderr.on('data', data => {
      output += data.toString();
    });

    serverless.on('close', code => {
      if (code > 0) {
        return reject(output);
      }
      return resolve(output);
    });
  });
}

/**
 * Copies the plugin to test env
 */
function copyPlugin() {
  execSync(`mkdir -p ${join(process.cwd(), '.serverless_plugins', 'serverless-deployment-manager')}`);
  copyFileSync(
    resolve('../../../src/index.js'),
    join(process.cwd(), '.serverless_plugins', 'serverless-deployment-manager', 'index.js')
  );
}

module.exports = { sls, copyPlugin };
