# Schedules

See Notion for more information on Schedules https://www.notion.so/lighthouseio/Scheduling-7de506f5cf754c0b9d14c09cc5cdce90

## DynamoDB Local

A local service for DynamoDB can be run using the `serverless-dynamodb-local`
plugin. See the readme for more information on usage https://github.com/99xt/serverless-dynamodb-local

```
sls dynamodb install
sls dynamodb start --stage dev
```

## Postman

A postman collection is stored within the `http` folder. This can be used to
run the [newman](https://github.com/postmanlabs/newman) tests and fire requests to your local dyanmodb instance created
above.

Update your .envrc file with the following properties and then run commands:

```
export IS_OFFLINE=TRUE
export REGION=localhost
```

```
sls dynamodb install
sls dynamodb start --stage dev
yarn test:http
```

When adding or editing an endpoint ensure you update the postman collection and
add/update tests as necessary.
