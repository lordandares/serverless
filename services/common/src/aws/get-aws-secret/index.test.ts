import {
  AWS_SECRET_ID,
  AWS_SECRET_KEY,
  MONGODB_URI,
  setupPlatformMocks,
  teardownPlatformMocks,
} from '../../../test/shared'
import { getAwsSecret, parseSecretString } from './index'

describe('serverless::services::mongo-helper::get-aws-secret', () => {
  describe('getAwsSecret', () => {
    beforeEach(setupPlatformMocks)
    afterEach(teardownPlatformMocks)

    it('should error if the secretId param is not defined', () => {
      expect.assertions(1)

      const secretId = ''
      const secretKey = 'MONGODB_URI'

      expect(getAwsSecret(secretId, secretKey)).rejects.toThrow(
        /Missing required param/,
      )
    })

    it('should error if the secretId is not valid', done => {
      expect.assertions(1)

      const secretId = 'invalidSecretId'
      const secretKey = AWS_SECRET_KEY

      getAwsSecret(secretId, secretKey).catch(err => {
        expect(err).toBeInstanceOf(Error)

        done()
      })
    })

    it('should error if the secretKey could not be found', done => {
      expect.assertions(1)

      const secretId = AWS_SECRET_ID
      const secretKey = 'invalidKey'

      getAwsSecret(secretId, secretKey).catch(err => {
        expect(err).toBeInstanceOf(Error)

        done()
      })
    })

    it('should return the secret when all params are valid', done => {
      expect.assertions(1)

      const secretId = AWS_SECRET_ID
      const secretKey = AWS_SECRET_KEY

      getAwsSecret(secretId, secretKey).then(secret => {
        expect(secret).toEqual(MONGODB_URI)

        done()
      })
    })

    it('should return all secrets when no secretKey is defined', done => {
      expect.assertions(1)

      const secretId = AWS_SECRET_ID

      getAwsSecret(secretId).then(secret => {
        expect(secret).toEqual({
          FOO: 'bar',
          MONGODB_URI: 'mongodb://localhost:27017/lighthouse-serverless-test',
        })

        done()
      })
    })
  })

  describe('parseSecretString', () => {
    it('should return an empty object if SecretString is not defined', () => {
      expect.assertions(1)

      const payload = {
        SecretString: '',
      }

      const parsedString = parseSecretString(payload)

      expect(parsedString).toEqual({})
    })

    it('should return a valid object if SecretString is defined', () => {
      expect.assertions(1)

      const payload = {
        SecretString: '{"MONGODB_URI": "mongodb://local:27017/db"}',
      }

      const parsedString = parseSecretString(payload)

      expect(parsedString).toEqual({
        MONGODB_URI: 'mongodb://local:27017/db',
      })
    })
  })
})
