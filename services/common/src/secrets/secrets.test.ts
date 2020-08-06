import {
  AWS_SECRET_ID,
  AWS_SECRET_KEY,
  MONGODB_URI,
  setupPlatformMocks,
  teardownPlatformMocks,
} from '../../test/shared'

// NOTE this import needs to be below the shared import so the mock is
// registered first
import { SecretsClient } from '@azure/keyvault-secrets'
import { getSecret, parseSecretString } from './secrets'

const mockgetSecreteResponse: GetSecretValueResponse = {
  ARN: 'SecretARNType',
  Name: 'SecretNameType',
  VersionId: 'SecretVersionIdType',
  SecretBinary: 'SecretBinaryType',
  SecretString: 'SecretStringType',
}

beforeEach(setupPlatformMocks)
afterEach(teardownPlatformMocks)

it('should error if the secretId param is not defined', () => {
  expect.assertions(1)

  const secretId = ''
  const secretKey = 'MONGODB_URI'

  expect(getSecret(secretId, secretKey)).rejects.toThrow(
    /Missing required param/,
  )
})

it('Should error if the platform is not supportes', () => {
  process.env.PLATFORM = 'notsupportedplatform'

  const secretId = 'AWS_SECRET_ID'
  const secretKey = 'invalidKey'

  expect(getSecret(secretId, secretKey)).rejects.toThrow(
    'Could not determine strategy for getSecretFn: PLATFORM: notsupportedplatform',
  )
})

describe('AWS', () => {
  beforeAll(() => {
    process.env.PLATFORM = 'AWS'
  })

  it('should error if the secretKey could not be found', done => {
    expect.assertions(1)

    const secretId = AWS_SECRET_ID
    const secretKey = 'invalidKey'

    getSecret(secretId, secretKey).catch(err => {
      expect(err).toBeInstanceOf(Error)

      done()
    })
  })

  it('should return the secret when all params are valid', done => {
    expect.assertions(1)

    const secretId = AWS_SECRET_ID
    const secretKey = AWS_SECRET_KEY

    getSecret(secretId, secretKey).then(secret => {
      expect(secret).toEqual(MONGODB_URI)

      done()
    })
  })

  it('should return all secrets when no secretKey is defined', done => {
    expect.assertions(1)

    const secretId = AWS_SECRET_ID
    const secretKey = ''

    getSecret(secretId, secretKey).then(secret => {
      expect(secret).toEqual({
        FOO: 'bar',
        MONGODB_URI: 'mongodb://localhost:27017/lighthouse-serverless-test',
      })

      done()
    })
  })

  it('should return empty object', () => {
    expect.assertions(1)
    const parse = parseSecretString(mockgetSecreteResponse)
    expect(parse).toEqual({})
  })

  it('should return empty', () => {
    expect.assertions(1)
    mockgetSecreteResponse.SecretString = undefined
    const parse = parseSecretString(mockgetSecreteResponse)
    expect(parse).toEqual({})
  })

  it('should return object', () => {
    expect.assertions(1)
    mockgetSecreteResponse.SecretString = `{"test": "testpares"}`
    const parse = parseSecretString(mockgetSecreteResponse)
    expect(parse).toEqual({ test: 'testpares' })
  })
})

describe('AZURE', () => {
  beforeEach(() => {
    process.env.PLATFORM = 'AZURE'
  })

  it('should error if the secretId could not be found', done => {
    expect.assertions(1)

    const secretVault = 'my-vault'
    const secretId = ''

    SecretsClient.prototype.getSecret = jest.fn().mockResolvedValue(undefined)

    getSecret(secretVault, secretId).catch(err => {
      expect(err).toMatchInlineSnapshot('[Error: Missing required secretId]')

      done()
    })
  })

  it('should error if the secretKey could not be found', done => {
    expect.assertions(1)

    const secretVault = 'my-vault'
    const secretId = 'TEST_SECRET'

    SecretsClient.prototype.getSecret = jest.fn().mockResolvedValue(undefined)

    getSecret(secretVault, secretId).catch(err => {
      expect(err).toBeInstanceOf(Error)

      done()
    })
  })

  it('should return the secret when all params are valid', done => {
    expect.assertions(1)

    const secretVault = 'my-vault'
    const secretId = 'TEST_SECRET'

    SecretsClient.prototype.getSecret = jest.fn().mockResolvedValue({
      value: MONGODB_URI,
    })

    getSecret(secretVault, secretId).then(secret => {
      expect(secret).toEqual(MONGODB_URI)

      done()
    })
  })
})
