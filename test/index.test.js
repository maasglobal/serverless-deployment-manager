'use strict';

const DeploymentGuardPlugin = require('../src');
const AWS = require('aws-sdk');
const { forEach, keys } = require('ramda');

jest.mock('aws-sdk', () => {
  const mocks = {
    getCallerIdentityMock: jest.fn(obj => {
      return {
        Account: '0123456789',
      };
    }),
  };

  const STS = {
    getCallerIdentity: obj => ({
      promise: () => mocks.getCallerIdentityMock(obj),
    }),
  };

  return {
    mocks,
    STS: jest.fn().mockImplementation(() => STS),
  };
});

afterEach(() => {
  forEach(mock => AWS.mocks[mock].mockClear(), keys(AWS.mocks));
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('#authorizer handler', () => {
  it('should pass if stage and account is correct', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev', region: 'eu-north-1' } },
      service: {
        custom: {
          deployment: [{ stage: 'dev', accountId: '0123456789', region: 'eu-north-1' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should pass if regexp stage and account is correct', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'sandbox' } },
      service: {
        custom: {
          deployment: [{ stage: '/box$/', accountId: '0123456789' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should pass if account is correct', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [{ accountId: '0123456789' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should pass if region is correct', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev', region: 'eu-north-1' } },
      service: {
        custom: {
          deployment: [{ region: 'eu-north-1' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should fail if region is incorrect', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev', region: 'us-east-1' } },
      service: {
        custom: {
          deployment: [{ region: 'eu-north-1' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).rejects.toThrow({
      message: "[serverless-deployment-manager] stage 'dev' cannot be deployed to region 'us-east-1'",
    });
  });

  it('should pass if regexp stage with flags and account is correct', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'SANDBOX' } },
      service: {
        custom: {
          deployment: [{ stage: '/box$/i', accountId: '0123456789' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should pass if stage and account is correct in one of the definitions', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [{ stage: 'dev', accountId: '1234567890' }, { stage: 'dev', accountId: '0123456789' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should pass if stage and account is correct in account ids array', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [{ stage: 'dev', accountIds: ['1234567890', '0123456789'] }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should pass if stage is correct and no account id is defined', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [{ stage: 'dev' }, { stage: 'prod' }],
        },
      },
    });

    await expect(deploymentManager.validateStageAndAccount()).resolves.toBeUndefined();
  });

  it('should throw error if trying to deploy to incorrect account', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [{ stage: 'dev', accountId: '1234567890' }],
        },
      },
    });
    await expect(deploymentManager.validateStageAndAccount()).rejects.toThrow({
      message: "[serverless-deployment-manager] stage 'dev' cannot be deployed to account '0123456789'",
    });
  });

  it('should throw error if trying to deploy to incorrect account', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [
            { accountId: '0123456789' },
            { stage: 'dev', accountId: '1234567890' },
            { stage: '/ev$/i', accountId: '1234567890' },
          ],
        },
      },
    });
    await expect(deploymentManager.validateStageAndAccount()).rejects.toThrow({
      message: "[serverless-deployment-manager] stage 'dev' cannot be deployed to account '0123456789'",
    });
  });

  it('should throw error if stage is not found from deployment config', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {
          deployment: [{ stage: 'prod', accountId: '0123456789' }],
        },
      },
    });
    await expect(deploymentManager.validateStageAndAccount()).rejects.toThrow({
      message: "[serverless-deployment-manager] stage 'dev' cannot be deployed",
    });
  });

  it('should throw error if deployment config is not defined', async () => {
    const deploymentManager = new DeploymentGuardPlugin({
      processedInput: { options: { stage: 'dev' } },
      service: {
        custom: {},
      },
    });
    await expect(deploymentManager.validateStageAndAccount()).rejects.toThrow({
      message: '[serverless-deployment-manager] service.custom.deployment definition is missing',
    });
  });
});
