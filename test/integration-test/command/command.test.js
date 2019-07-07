'use strict';

const sls = require('../sls');

beforeAll(() => {
  process.chdir('test/integration-test/command');
});

describe('command', () => {
  it('should output validate command', async () => {
    const result = await sls(['']);
    expect(result).toContain('Validates current AWS account agains deployment configuration');
  });

  it('should fail without custom deployment config', async () => {
    await expect(sls(['validate', '--stage', 'dev'])).rejects.toContain(
      '[serverless-deployment-manager] service.custom.deployment definition is missing'
    );
  });
});
