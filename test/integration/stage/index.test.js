'use strict';

const { copyPlugin, sls } = require('../lib');

beforeAll(() => {
  process.chdir(__dirname);
  copyPlugin();
});

describe('validate', () => {
  it('should validate with correct stage', async () => {
    const result = await sls(['validate', '--stage', 'dev']);
    expect(result).toBe('');
  });

  it('should fail with incorrect stage', async () => {
    await expect(sls(['validate', '--stage', 'prod'])).rejects.toContain(
      "[serverless-deployment-manager] stage 'prod' cannot be deployed"
    );
  });
});
