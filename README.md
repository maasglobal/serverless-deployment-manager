# Serverless Deployment Manager Plugin

This plugin will prevent you from deploying stack into incorrect AWS account.

## Install

```shell
npm i serverless-deployment-manager --save-dev
```

## Example usage

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - stage: dev
      accountId: '0123456789'
    - stage: /box$/ # regexp
      accountId: '0123456789'
    - stage: test
      accountId: '1234567890'
    - stage: prod
      accountId: '2345678901'
```

In the example, dev and, e.g. sandbox stages are allowed to deploy to account id '0123456789', test to '1234567890', and production stage to account id '2345678901'.

## Commands

This plugin is triggered before deployment, but if you want manually to test if your current credentials can deploy to a particular stage, you can run the following command.

```shell
sls validate --stage dev
```
