jest.mock('./helpers/winteam-request')
jest.mock('@lighthouse/serverless-common', () => ({
  AWS: {
    getAwsSecret: secretId => {
      if (secretId === 'invalid-secret') {
        return Promise.reject(new Error('ResourceNotFoundException'))
      }

      if (secretId === 'empty-secret') {
        return Promise.resolve({})
      }

      if (secretId === 'missing-params') {
        return Promise.resolve({
          TENANT_ID_5cad3ceafc13ae46b4000064: 'lio-tenant-id',
          WINTEAM_BASE_URL: 'hxxps://base.url',
        })
      }

      if (secretId === 'valid-secret') {
        return Promise.resolve({
          TENANT_ID_5cad3ceafc13ae46b4000065: 'lio-tenant-id',
          WINTEAM_BASE_URL: 'hxxps://base.url',
          WINTEAM_SUBSCRIPTION_KEY: 'lio-subscription-key',
        })
      }
    },
  },
}))

import winteamPostRequest from './helpers/winteam-request'
import { request } from './index'

describe('integrations::winteam::request', () => {
  beforeEach(() => jest.resetAllMocks())
  afterAll(() => jest.restoreAllMocks())

  it('should error if the `WINTEAM_SECRET_ID` env var is missing', async () => {
    expect.assertions(1)

    process.env.WINTEAM_SECRET_ID = ''

    try {
      const application = {
        _id: '5cad3ceafc13ae46b4000064',
        name: 'Test Application',
        plugins: {
          winteam: {
            enabled: true,
          },
        },
      }

      const params = {
        endpoint: '/winteam/test',
        message: {},
        method: 'POST',
      }

      await request(application, params)
    } catch (err) {
      expect(err.message).toMatch(/WinteamRequest: missing required values/)
    }
  })

  it('should error if the AWS secret is invalid', async () => {
    expect.assertions(1)

    process.env.WINTEAM_SECRET_ID = 'invalid-secret'

    try {
      const application = {
        _id: '5cad3ceafc13ae46b4000064',
        name: 'Test Application',
        plugins: {
          winteam: {
            enabled: true,
          },
        },
      }

      const params = {
        endpoint: '/winteam/test',
      }

      await request(application, params)
    } catch (err) {
      expect(err.message).toMatch(/ResourceNotFoundException/)
    }
  })

  it('should error if the AWS secret is empty', async () => {
    expect.assertions(1)
    process.env.WINTEAM_SECRET_ID = 'empty-secret'

    try {
      const application = {
        _id: '5cad3ceafc13ae46b4000064',
        name: 'Test Application',
        plugins: {
          winteam: {
            enabled: true,
            options: {},
          },
        },
      }

      const params = {
        endpoint: '/winteam/test',
        message: {},
        method: 'POST',
      }

      await request(application, params)
    } catch (err) {
      expect(err.message).toMatch(
        /WinteamRequest: AWS secret does not contain any values/,
      )
    }
  })

  it('should error if WINTEAM_BASE_URL is missing from the AWS Secrets response', async () => {
    expect.assertions(1)
    process.env.WINTEAM_SECRET_ID = 'missing-params'

    try {
      const application = {
        _id: '5cad3ceafc13ae46b4000064',
        name: 'Test Application',
        plugins: {
          winteam: {
            enabled: true,
          },
        },
      }

      const params = {
        endpoint: '/winteam/test',
        message: {},
        method: 'POST',
      }

      await request(application, params)
    } catch (err) {
      expect(err.message).toMatch(/WinteamRequest: Missing required params/)
    }
  })

  it('should handle a successful shift response from WinTeam', async () => {
    expect.assertions(1)
    process.env.WINTEAM_SECRET_ID = 'valid-secret'

    winteamPostRequest.mockResolvedValue({
      Result: {
        StatusReason: '201',
        PunchStatus: '201',
        JobNumber: '101',
        PunchTime: '2019-01-23 11:00:00.000+1100',
      },
      Errors: [],
    })

    const application = {
      _id: '5cad3ceafc13ae46b4000065',
      name: 'Test Application',
      plugins: {
        winteam: {
          enabled: true,
        },
      },
    }

    const params = {
      endpoint: '/winteam/test',
      message: {
        Coordinates: {
          Latitude: 90,
          Longitude: -45,
        },
        EmployeeNumber: 'EM1234',
        JobNumber: 'JOB1',
        PunchTime: '2019-01-23T00:00:00.000Z',
      },
      method: 'POST',
    }

    const result = await request(application, params)

    expect(result).toEqual({
      Errors: [],
      Result: {
        StatusReason: '201',
        PunchStatus: '201',
        JobNumber: '101',
        PunchTime: '2019-01-23 11:00:00.000+1100',
      },
    })
  })
})
