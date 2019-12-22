'use strict';

const { filter, isNil, contains, pipe, head, reduce, sortBy, concat, not, isEmpty, findIndex } = require('ramda');

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
        usage: 'Validates current AWS account agains deployment configuration',
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
      'before:deploy:deploy': this.validateStageAndAccount.bind(this),
      'before:deploy:function:initialize': this.validateStageAndAccount.bind(this),
    };
  }

  async validateStageAndAccount() {
    const { processedInput, service } = this.serverless;
    if (isNil(service.custom) || isNil(service.custom.deployment)) {
      throw new Error('[serverless-deployment-manager] service.custom.deployment definition is missing');
    }

    const deploymentDefinition = pipe(
      filter(({ stage }) => testStage(processedInput.options.stage, stage)),
      sortBy(({ stage }) => stageType(stage)),
      reduce((acc, item) => {
        const accountIds = item.accountIds || [];
        const regions = item.regions || [];
        const currentItem = {
          stage: item.stage,
          accountIds: not(isNil(item.accountId)) ? [item.accountId] : accountIds,
          regions: not(isNil(item.region)) ? [item.region] : regions,
        };
        const existingItemIndex = findIndex(({ stage }) => currentItem.stage === stage, acc);
        if (existingItemIndex > -1) {
          acc[existingItemIndex].accountIds = concat(acc[existingItemIndex].accountIds, currentItem.accountIds);
          acc[existingItemIndex].regions = concat(acc[existingItemIndex].regions, currentItem.regions);
        } else {
          acc = concat(acc, [currentItem]);
        }
        return acc;
      }, []),
      head
    )(service.custom.deployment);

    if (isNil(deploymentDefinition)) {
      throw new Error(`[serverless-deployment-manager] stage '${processedInput.options.stage}' cannot be deployed`);
    }

    if (not(isEmpty(deploymentDefinition.accountIds))) {
      const Account = await this.serverless.providers.aws.getAccountId();
      if (not(contains(Account, deploymentDefinition.accountIds))) {
        throw new Error(
          `[serverless-deployment-manager] stage '${processedInput.options.stage}' cannot be deployed to account '${Account}'`
        );
      }
    }

    if (not(isEmpty(deploymentDefinition.regions))) {
      if (not(contains(processedInput.options.region, deploymentDefinition.regions))) {
        throw new Error(
          `[serverless-deployment-manager] stage '${processedInput.options.stage}' cannot be deployed to region '${processedInput.options.region}'`
        );
      }
    }
  }
}

module.exports = DeploymentManagerPlugin;
