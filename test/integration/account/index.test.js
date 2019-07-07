'use strict';

const { isNil } = require('ramda');
const sls = require('../sls');

beforeAll(() => {
  if (isNil(process.env.ACCOUNT_ID)) {
    throw new Error('ACCOUNT_ID is undefined');
  }
  jest.setTimeout(10000);
  process.chdir(__dirname);
});

describe('validate', () => {
  it('should validate with dev account', async () => {
    const result = await sls(['validate', '--stage', 'dev', '--region', 'eu-north-1']);
    expect(result).toBe('');
  });

  it('should validate with test account', async () => {
    const result = await sls(['validate', '--stage', 'test', '--region', 'eu-north-1']);
    expect(result).toBe('');
  });

  it('should fail to validate with incorrect account', async () => {
    await expect(sls(['validate', '--stage', 'prod', '--region', 'eu-north-1'])).rejects.toContain(
      `[serverless-deployment-manager] stage 'prod' cannot be deployed to account '${process.env.ACCOUNT_ID}'`
    );
  });
});
