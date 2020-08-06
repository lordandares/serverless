import { EnvironmentCredential } from '@azure/identity'
import { Secret, SecretsClient } from '@azure/keyvault-secrets'
import AWS from 'aws-sdk'
import { attempt, isError } from 'lodash'

// TODO move up if shared in future
enum Platforms {
  AWS = 'AWS',
  AZURE = 'AZURE',
}

interface ENV {
  env: {
    AWS_REGION: string
    AZURE_CLIENT_ID: string
    AZURE_CLIENT_SECRET: string
    AZURE_TENANT_ID: string
    PLATFORM: Platforms
  }
}

declare var process: ENV

const strategies = {
  [Platforms.AWS]: getAwsSecret,
  [Platforms.AZURE]: getAzureSecret,
}

export { getSecret }

async function getSecret(secretId: string): Promise<object>
async function getSecret(secretId: string, secretKey: string): Promise<string>
async function getSecret(
  secretId: string,
  secretKey?: string,
): Promise<string | object | undefined> {
  if (!secretId) {
    throw new Error(`Missing required param: secretId`)
  }

  const { PLATFORM } = process.env

  const getSecretFn = strategies[PLATFORM]

  if (!getSecretFn) {
    throw new Error(
      `Could not determine strategy for getSecretFn: PLATFORM: ${PLATFORM}`,
    )
  }

  return await getSecretFn(secretId, secretKey)
}

async function getAwsSecret(secretId: string): Promise<object>
async function getAwsSecret(
  secretId: string,
  secretKey: string,
): Promise<string>
async function getAwsSecret(
  secretId: string,
  secretKey?: string,
): Promise<string | object> {
  try {
    const region = process.env.AWS_REGION

    const secretsClient = new AWS.SecretsManager({ region })

    const secretPayload: AWS.SecretsManager.GetSecretValueResponse = await secretsClient
      .getSecretValue({ SecretId: secretId })
      .promise()

    const secret: object = parseSecretString(secretPayload)

    // Return early if secretKey isn't defined (we want the full set of key/values)
    if (!secretKey) {
      return secret
    }

    const secretValue = secret[secretKey]

    if (!secretValue) {
      throw new Error('Secret value could not be found')
    }

    return secretValue
  } catch (err) {
    throw new Error(`AwsGetSecretError: ${err.code}, ${err.message}`)
  }
}

async function getAzureSecret(
  secretVault: string,
  secretId?: string,
): Promise<string | undefined> {
  if (!secretId) {
    throw new Error('Missing required secretId')
  }

  try {
    const credential = new EnvironmentCredential()
    const url = `https://${secretVault}.vault.azure.net`
    const client = new SecretsClient(url, credential)
    const secret: Secret = await client.getSecret(secretId)

    if (!secret) {
      throw new Error('Secret value could not be found')
    }
    return secret.value
  } catch (err) {
    throw new Error(`AzureGetSecretError: ${err.code}, ${err.message}`)
  }
}

export function parseSecretString(
  payload: AWS.SecretsManager.GetSecretValueResponse,
): object {
  const secretString = payload.SecretString || ''

  const parsed = attempt(JSON.parse, secretString)

  return isError(parsed) ? {} : parsed
}
