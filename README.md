# Serverless

Lighthouse Serverless projects

## Requirements

- Nodejs version 8.10.0 (this is the latest version supported by AWS Lambda)
- Direnv for local environment variable management (https://direnv.net/)
- Circleci CLI for testing config.yml (https://circleci.com/docs/2.0/local-cli/)
- Java openjdk-11-jre-headless

## Getting started

There is an example service which can be used as a reference point for how Serverless works.

To get started run:

```
# Copy envrc file
cp envrc.example .envrc

# Edit your .envrc file with config to suit

cd ./services/example-service

# Install dependencies
nvm install
nvm use
yarn
npx lerna bootstrap

# Adding external dependencies
npx lerna add <<package-name>> --scope=<<destination package>>

Example:
npx lerna add date-fns --scope=@lighthouse/serverless-winteam-service

# Linking local packages

Use the following command to link local packages with lerna:
npx lerna add @lighthouse/<<package to be linked>> --scope=@lighthouse/<<destination package>>

Example:
npx lerna add @lighthouse/serverless-common --scope=@lighthouse/serverless-winteam-service

# Start local Serverless server
serverless
serverless offline start

# POST data to your local Serverless server to test it
curl -X POST \
  http://localhost:3000/standup-reminder \
  -H 'Content-Type: application/json' \
  -d '{
    "users": ["@jim"]
  }'
```

## Run tests

```
# run all tests from root directory
yarn test

# run service test
cd ./services/example-service
yarn test
```

## Deployment

Run the following command to deploy a dev environment on AWS

```
# deploy to dev environment
yarn deploy
```

This will create a Cloudformation stack on AWS and return an API endpoint to test against

## Todo

- [ ] Automate decommisioning of any deployed branches using github hooks and serverless `remove` command
- [ ] Setup generator for project scaffolding

## Best Practices

- Avoid side effects generated within lambdas. If you need to manage state, use Step Functions
- Unit test code in isolation from lambda logic. This keeps are code agnostic from AWS
- Always validate lambda handler calls expected module (use spys/mocks)
- Mock out all long running methods (e.g. fetch)
- 100% coverage

## Troubleshooting

### DynamoDb Local

This module is a little flaky and not actively maintained it seems. I found this
issue useful for getting it working on MacOS:

https://github.com/99xt/serverless-dynamodb-local/issues/210#issuecomment-467090756

## FAQs

### How do I start a new project?

For now the best way is to use the example project as a starting point. If you want to improve this, open a PR to implementent a generator for scaffolding a new project

### How do I run a project locally?

We use [serverless-offline](https://github.com/dherault/serverless-offline) for this. Projects should have a `start` script as an alias for this, but you can manually run `sls offline start`

### How do I deploy a branch I'm working on?

Use the `--stage` option of the serverless `deploy` command. e.g. `sls deploy --stage feature/my-branch`.

_Don't forget to decommision the deployment once the branch is finished:_ `sls remove --stage feature/my-branch`

### How do I share logic between projects?

We need a better solution for this, but for now we should use a custom npm module, e.g. `@lighthouse/common` or `@lighthouse/serverless-common`. Lerna might be able to help us out here too!
