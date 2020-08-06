import { KMS } from 'aws-sdk'

export async function getSecret(value) {
  const config = { apiVersion: 'latest' }
  const kms = new KMS(config)

  const cipher = new Buffer(value, 'base64')
  const secret = await kms.decrypt({ CiphertextBlob: cipher }).promise()
  const plaintext = secret.Plaintext

  return plaintext
}

export default getSecret
