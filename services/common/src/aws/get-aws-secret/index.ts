import AWS from 'aws-sdk'
import { attempt, isError } from 'lodash'

// NOTE This module is deprecated. Use the secrets module instead

export function getAwsSecret(secretId: string, secretKey?: string) {
  console.info('aws:get-secret', { secretId })

  if (!secretId) {
    return Promise.reject(
      new Error(`Missing required param: secretId:${secretId}`),
    )
  }

  const region = process.env.AWS_REGION

  const secretsClient = new AWS.SecretsManager({ region })

  return secretsClient
    .getSecretValue({ SecretId: secretId })
    .promise()
    .then((payload: AWS.SecretsManager.GetSecretValueResponse) => {
      console.info('aws:get-secret:success', { secretId })

      const secret = parseSecretString(payload)

      // Return early if secretKey isn't defined (we want the full set of key/values)
      if (!secretKey) return secret

      const secretValue = secret[secretKey]

      if (!secretValue) {
        throw new Error('Secret value could not be found')
      }

      return secretValue
    })
    .catch(err => {
      throw new Error(`AWSSecretFetchError: ${err.code}, ${err.message}`)
    })
}

export function parseSecretString(
  payload: AWS.SecretsManager.GetSecretValueResponse,
) {
  const secretString = payload.SecretString || ''

  const parsed = attempt(JSON.parse, secretString)

  return isError(parsed) ? {} : parsed
}
