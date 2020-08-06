jest.mock('@lighthouse/serverless-integrations')
jest.mock('../../helpers/')

import { winteam } from '@lighthouse/serverless-integrations'
import { getWinTeamTimePunch } from '../../helpers/'
import winteamShift from './index'

describe('handlers:winteam-shift-handler', () => {
  beforeEach(() => jest.resetAllMocks())
  afterAll(() => jest.restoreAllMocks())

  it('should skip if the application does not have WinTeam enabled', async () => {
    expect.assertions(1)

    const params = {
      application: {
        _id: 'appId',
        name: 'App name',
        plugins: {},
      },
      event: 'shift-start',
      shift: {
        _id: 'shiftId',
        application: 'appId',
        location: 'locationId',
        start: {
          time: 'startTime',
        },
        user: 'userId',
      },
      user: {
        _id: 'userId',
      },
    }

    try {
      const result = await winteamShift(params)

      expect(result).toBeUndefined()
    } catch (err) {}
  })

  it('should error if WinTeam is enabled, and an endpoint cannot be found', async () => {
    expect.assertions(1)

    try {
      const params = {
        application: {
          _id: 'appId',
          name: 'App name',
          plugins: {
            winteam: {
              enabled: true,
              secrets: {
                awsSecretId: 'aws-secret-id',
              },
            },
          },
        },
        event: 'invalid-event-type',
        shift: {
          _id: 'shiftId',
          application: 'appId',
          location: 'locationId',
          start: {
            time: 'startTime',
          },
          user: 'userId',
        },
        user: {
          _id: 'userId',
        },
      }

      await winteamShift(params)
    } catch (err) {
      expect(err.message).toMatch(/Could not find endpoint for event/)
    }
  })

  it('should return if a WinTeam Time Punch cannot be found', async () => {
    getWinTeamTimePunch.mockResolvedValue(null)
    expect.assertions(3)

    const params = {
      application: {
        _id: 'appId',
        name: 'App name',
        plugins: {
          winteam: {
            enabled: true,
            secrets: {
              awsSecretId: 'aws-secret-id',
            },
          },
        },
      },
      event: 'shift-start',
      shift: {
        _id: 'shiftId',
        application: 'appId',
        location: 'locationId',
        start: {
          time: 'startTime',
        },
        user: 'userId',
      },
      user: {
        _id: 'userId',
      },
    }

    try {
      expect(getWinTeamTimePunch.mock.calls).toHaveLength(0)

      const result = await winteamShift(params)

      expect(result).toBeUndefined()
      expect(getWinTeamTimePunch.mock.calls).toHaveLength(1)
    } catch (err) {}
  })

  it('should error when an error response code is received from WinTeam', async () => {
    expect.assertions(3)

    getWinTeamTimePunch.mockResolvedValue({
      EmployeeNumber: '65',
      PunchTime: '2019-01-23 11:00:00.000+1100',
    })

    winteam.request.mockRejectedValue(new Error('WinTeamAPIError'))

    const params = {
      application: {
        _id: 'appId',
        name: 'App name',
        plugins: {
          winteam: {
            enabled: true,
            secrets: {
              awsSecretId: 'aws-secret-id',
            },
          },
        },
      },
      event: 'shift-start',
      shift: {
        _id: 'shiftId',
        application: 'appId',
        location: 'locationId',
        start: {
          time: 'startTime',
        },
        user: 'userId',
      },
      user: {
        _id: 'userId',
      },
    }

    try {
      expect(winteam.request.mock.calls).toHaveLength(0)
      await winteamShift(params)
    } catch (err) {
      expect(winteam.request.mock.calls).toHaveLength(1)
      expect(err.message).toMatch(/WinTeamAPIError/)
    }
  })

  it('should handle a rejected shift from WinTeam', async () => {
    expect.assertions(5)

    getWinTeamTimePunch.mockResolvedValue({
      Coordinate: {
        Latitude: 90,
        Longitude: -45,
      },
      EmployeeNumber: '65',
      PunchTime: '2019-01-23 11:00:00.000+1100',
    })

    winteam.request.mockResolvedValue({
      Result: {
        StatusReason: '100',
        PunchStatus: '403',
        JobNumber: '101',
        PunchTime: '2019-01-23 11:00:00.000+1100',
      },
      Errors: [
        {
          FieldName: 'Coordinates.Latitude',
          AttemptedValue: '90',
          ErrorMessage: 'Outside of bounds',
          ErrorType: 'fatal',
        },
        {
          FieldName: 'Coordinates.Longitude',
          AttemptedValue: '-45',
          ErrorMessage: 'Outside of bounds',
          ErrorType: 'fatal',
        },
      ],
    })

    try {
      const params = {
        application: {
          _id: 'appId',
          name: 'App name',
          plugins: {
            winteam: {
              enabled: true,
              secrets: {
                awsSecretId: 'aws-secret-id',
              },
            },
          },
        },
        event: 'shift-start',
        shift: {
          _id: 'shiftId',
          application: 'appId',
          location: 'locationId',
          start: {
            gps: {
              geometry: [-45, 90],
            },
            time: 'startTime',
          },
          user: 'userId',
        },
        user: {
          _id: 'userId',
        },
      }

      expect(getWinTeamTimePunch.mock.calls).toHaveLength(0)
      expect(winteam.request.mock.calls).toHaveLength(0)

      const result = await winteamShift(params)

      expect(result).toEqual({
        ...params,
        errors: [
          {
            FieldName: 'Coordinates.Latitude',
            AttemptedValue: '90',
            ErrorMessage: 'Outside of bounds',
            ErrorType: 'fatal',
          },
          {
            FieldName: 'Coordinates.Longitude',
            AttemptedValue: '-45',
            ErrorMessage: 'Outside of bounds',
            ErrorType: 'fatal',
          },
        ],
        hasErrors: true,
        result: {
          JobNumber: '101',
          PunchStatus: '403',
          PunchTime: '2019-01-23 11:00:00.000+1100',
          StatusReason: '100',
        },
      })

      expect(getWinTeamTimePunch.mock.calls).toHaveLength(1)
      expect(winteam.request.mock.calls).toHaveLength(1)
    } catch (err) {}
  })

  it('should handle a successful shift start from WinTeam', async () => {
    expect.assertions(5)

    getWinTeamTimePunch.mockResolvedValue({
      EmployeeNumber: '65',
      PunchTime: '2019-01-23 11:00:00.000+1100',
    })

    winteam.request.mockResolvedValue({
      Result: {
        JobNumber: '101',
        PunchStatus: '201',
        PunchTime: '2019-01-23 11:00:00.000+1100',
        StatusReason: '100',
      },
      Errors: null,
    })

    try {
      const params = {
        application: {
          _id: 'appId',
          name: 'App name',
          plugins: {
            winteam: {
              enabled: true,
              secrets: {
                awsSecretId: 'aws-secret-id',
              },
            },
          },
        },
        event: 'shift-start',
        shift: {
          _id: 'shiftId',
          application: 'appId',
          location: 'locationId',
          start: {
            time: 'startTime',
          },
          user: 'userId',
        },
        user: {
          _id: 'userId',
        },
      }

      expect(getWinTeamTimePunch.mock.calls).toHaveLength(0)
      expect(winteam.request.mock.calls).toHaveLength(0)

      const result = await winteamShift(params)

      expect(result).toEqual({
        ...params,
        errors: null,
        hasErrors: false,
        result: {
          JobNumber: '101',
          PunchStatus: '201',
          PunchTime: '2019-01-23 11:00:00.000+1100',
          StatusReason: '100',
        },
      })

      expect(getWinTeamTimePunch.mock.calls).toHaveLength(1)
      expect(winteam.request.mock.calls).toHaveLength(1)
    } catch (err) {}
  })
})
