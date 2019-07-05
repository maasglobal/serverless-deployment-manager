'use strict';

const AWS = require('aws-sdk');
const { filter, isNil, pipe, head, sortBy } = require('ramda');

function stageType(stage) {
  if (/^\/.*\/(i|g|m|s|u|y)*$/.test(stage)) {
    return 1;
  } else if (isNil(stage)) {
    return 2;
  }
  return 0;
}

function testStage(stage, deploymentDefinitionStage) {
  if (isNil(deploymentDefinitionStage)) {
    return true;
  }
  let regexp;
  if (stageType(deploymentDefinitionStage) === 1) {
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

    const deploymentDefinition = pipe(
      filter(({ stage }) => testStage(processedInput.options.stage, stage)),
      sortBy(({ stage }) => stageType(stage)),
      head
    )(service.custom.deployment);

    if (isNil(deploymentDefinition)) {
      throw new Error(`[serverless-deployment-guard] stage '${processedInput.options.stage}' cannot be deployed`);
    }

    if (!isNil(deploymentDefinition.accountId)) {
      const sts = new AWS.STS({ region: processedInput.options.region });
      const { Account } = await sts.getCallerIdentity().promise();
      if (deploymentDefinition.accountId !== Account) {
        throw new Error(
          `[serverless-deployment-guard] stage '${processedInput.options.stage}' cannot be deployed to account '${Account}'`
        );
      }
    }
  }
}

module.exports = DeploymentManagerPlugin;
