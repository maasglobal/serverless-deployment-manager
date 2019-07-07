'use strict';

const { spawn } = require('child_process');
const { concat, filter, isEmpty, not } = require('ramda');

async function sls(parameters) {
  return new Promise((resolve, reject) => {
    const run = filter(parameter => not(isEmpty(parameter)), concat(['sls', '--no-color'], parameters));
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

module.exports = sls;
