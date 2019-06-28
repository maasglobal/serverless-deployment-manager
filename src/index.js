'use strict';

const AWS = require('aws-sdk');

class DeploymentManagerPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.commands = {
      validate: {
        usage: 'Checks that stage matched current AWS account id defined in serverless.yml',
        lifecycleEvents: ['validate'],
        options: {
          stage: {
            usage: ' "--stage dev" or "-s dev"',
            required: true,
            shortcut: 's',
          },
        },
      },
    };
    this.hooks = {
      'validate:validate': this.validateStageAndAccount.bind(this),
      'before:package:initialize': this.validateStageAndAccount.bind(this),
      'before:deploy:function:initialize': this.validateStageAndAccount.bind(this),
    };
  }

  async validateStageAndAccount() {
    const { processedInput, service } = this.serverless;
    if (!service.custom.deployment) {
      throw new Error('[serverless-deployment-guard] service.custom.deployment definition is missing');
    }

    if (!service.custom.deployment.map(({ stage }) => stage).includes(processedInput.options.stage)) {
      throw new Error(`[serverless-deployment-guard] stage '${processedInput.options.stage}' cannot be deployed`);
    }

    const sts = new AWS.STS({ region: processedInput.options.region });
    const { Account } = await sts.getCallerIdentity().promise();

    const exists = !!service.custom.deployment.find(item => {
      return item.stage && item.accountId && item.stage === processedInput.options.stage && item.accountId === Account;
    });

    if (!exists) {
      throw new Error(
        `[serverless-deployment-guard] stage '${processedInput.options.stage}' cannot be deployed to account '${Account}'`
      );
    }
  }
}

module.exports = DeploymentManagerPlugin;
