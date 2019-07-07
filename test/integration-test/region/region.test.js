'use strict';

const sls = require('../sls');

beforeAll(() => {
  process.chdir('test/integration-test/region');
});

describe('validate', () => {
  it('should validate with region defined in region', async () => {
    const result = await sls(['validate', '--stage', 'dev', '--region', 'eu-west-2']);
    expect(result).toBe('');
  });

  it('should validate with region defined in regions', async () => {
    const result = await sls(['validate', '--stage', 'dev', '--region', 'eu-central-1']);
    expect(result).toBe('');
  });

  it('should fail to validate with incorrect region', async () => {
    await expect(sls(['validate', '--stage', 'dev', '--region', 'us-east-1'])).rejects.toContain(
      "[serverless-deployment-manager] stage 'dev' cannot be deployed to region 'us-east-1'"
    );
  });
});
