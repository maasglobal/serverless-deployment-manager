'use strict';

const AWS = require('aws-sdk');

function testStage(stage, deploymentDefinitionStage) {
  let regexp;
  if (/^\/.*\/(i|g|m|s|u|y)*$/.test(deploymentDefinitionStage)) {
    const pattern = deploymentDefinitionStage.substr(1, deploymentDefinitionStage.lastIndexOf('/') - 1);
    const flag = deploymentDefinitionStage.substr(deploymentDefinitionStage.lastIndexOf('/') + 1);
    regexp = new RegExp(pattern, flag);
  } else {
    regexp = new RegExp(`^${deploymentDefinitionStage}$`);
  }
  return regexp.test(stage);
}

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

    const deploymentDefinitions = service.custom.deployment.filter(({ stage }) =>
      testStage(processedInput.options.stage, stage)
    );

    if (deploymentDefinitions.length === 0) {
      throw new Error(`[serverless-deployment-guard] stage '${processedInput.options.stage}' cannot be deployed`);
    }

    if (deploymentDefinitions.every(item => !!item.accountId)) {
      const sts = new AWS.STS({ region: processedInput.options.region });
      const { Account } = await sts.getCallerIdentity().promise();

      const exists = !!service.custom.deployment.find(item => {
        return (
          item.stage &&
          item.accountId &&
          testStage(processedInput.options.stage, item.stage) &&
          item.accountId.toString() === Account
        );
      });
      if (!exists) {
        throw new Error(
          `[serverless-deployment-guard] stage '${processedInput.options.stage}' cannot be deployed to account '${Account}'`
        );
      }
    }
  }
}

module.exports = DeploymentManagerPlugin;
