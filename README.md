# Serverless Deployment Manager Plugin

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)

This [Serverless Framework](https://serverless.com) plugin will prevent you from deploying stack into incorrect AWS account.

## Install

```shell
npm i serverless-deployment-manager --save-dev
```

## Example usage

1. Account id only

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - accountId: '0123456789'
```

or multiple accounts

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - accountIds:
        - '0123456789'
        - '1234567890'
```

2. Stage only

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - stage: dev
    - stage: /box$/ # regexp
    - stage: test
    - stage: prod
```

3. Region only

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - region: 'eu-west-1'
```

or multiple regions

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - regions:
        - 'eu-north-1'
        - 'eu-west-1'
```

4. Stage, region, and account id

```yaml
# serverless.yml

plugins:
  - serverless-deployment-manager

custom:
  deployment:
    - stage: dev
      accountIds:
        - '0123456789'
        - '3456789012'
      regions:
        - eu-north-1
        - eu-west-1
    - stage: /box$/ # regexp
      accountId: '0123456789'
      region: eu-north-1
    - stage: test
      accountId: '1234567890'
      region: eu-north-1
    - stage: prod
      accountId: '2345678901'
      region: eu-north-1
```

In the example, dev and, e.g. sandbox stages are allowed to deploy to account id '0123456789', test to '1234567890', and production stage to account id '2345678901'.

## Commands

This plugin is triggered before deployment, but if you want manually to test if your current credentials can deploy to a particular stage, you can run the following command.

```shell
sls validate --stage dev
```
