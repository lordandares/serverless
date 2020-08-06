jest.mock('@azure/keyvault-secrets')

const AWS = require('aws-sdk-mock')

AWS.setSDKInstance(require('aws-sdk'))

const MONGODB_URI = 'mongodb://localhost:27017/lighthouse-serverless-test'

const AWS_REGION = 'us-east-1'
const AWS_SECRET_KEY = 'MONGODB_URI'
const AWS_SECRET_ID = 'lio/application/service/environment'
const AWS_SECRET_RESPONSE = {
  SecretString: `{ "${AWS_SECRET_KEY}": "${MONGODB_URI}", "FOO": "bar" }`,
}

const setupAwsMocks = () => {
  process.env.AWS_REGION = AWS_REGION

  AWS.mock('SecretsManager', 'getSecretValue', (payload, callback) => {
    if (payload.SecretId !== AWS_SECRET_ID) {
      const error = new Error('ResourceNotFoundException')

      return callback(error)
    }

    callback(null, AWS_SECRET_RESPONSE)
  })
}

const teardownAwsMocks = () => AWS.restore()

const setupAzureMocks = () => {
  process.env.AZURE_CLIENT_ID = 'clientId'
  process.env.AZURE_TENANT_ID = 'tenantId'
  process.env.AZURE_CLIENT_SECRET = 'secret'
}

const setupPlatformMocks = () => {
  // default to AWS
  process.env.PLATFORM = 'AWS'

  setupAwsMocks()
  setupAzureMocks()
}

const teardownPlatformMocks = () => {
  teardownAwsMocks()
  jest.clearAllMocks()
}

export {
  AWS_REGION,
  AWS_SECRET_ID,
  AWS_SECRET_KEY,
  AWS_SECRET_RESPONSE,
  MONGODB_URI,
  setupPlatformMocks,
  teardownPlatformMocks,
}
