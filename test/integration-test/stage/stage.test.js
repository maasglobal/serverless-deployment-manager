'use strict';

const sls = require('../sls');

beforeAll(() => {
  process.chdir('test/integration-test/stage');
});

describe('validate', () => {
  it('should output validate command 1', async () => {
    const result = await sls(['validate', '--stage', 'dev']);
    expect(result).toBe('');
  });

  it('should output validate command 2', async () => {
    await expect(sls(['validate', '--stage', 'prod'])).rejects.toContain(
      "[serverless-deployment-manager] stage 'prod' cannot be deployed"
    );
  });
});
