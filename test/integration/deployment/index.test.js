'use strict';

const { isNil } = require('ramda');
const { copyPlugin, sls } = require('../lib');

beforeAll(() => {
  if (isNil(process.env.ACCOUNT_ID)) {
    throw new Error('ACCOUNT_ID is undefined');
  }
  process.chdir(__dirname);
  copyPlugin();
  jest.setTimeout(120000);
});

describe('validate', () => {
  it('should deploy with correct account id, region, and stage', async () => {
    const result = await sls(['deploy', '--stage', 'dev', '--region', 'eu-north-1']);
    expect(result).toContain('hello: deployment-manager-integration-dev-hello');
  });

  it('should fail to deploy with incorrect region', async () => {
    await expect(sls(['deploy', '--stage', 'test', '--region', 'eu-north-1'])).rejects.toContain(
      "[serverless-deployment-manager] stage 'test' cannot be deployed to region 'eu-north-1'"
    );
  });

  it('should fail to deploy with incorrect account id', async () => {
    await expect(sls(['deploy', '--stage', 'prod', '--region', 'eu-north-1'])).rejects.toContain(
      `[serverless-deployment-manager] stage 'prod' cannot be deployed to account '${process.env.ACCOUNT_ID}'`
    );
  });
});
