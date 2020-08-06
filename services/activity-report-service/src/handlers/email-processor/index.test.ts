const mockToArray = jest.fn().mockReturnValue([])
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFindOne = jest.fn().mockReturnValue({})
const mockCollection = jest
  .fn()
  .mockReturnValue({ find: mockFind, findOne: mockFindOne })

jest.mock('../../helpers/build-email')
jest.mock('../../helpers/fetch-applications')
jest.mock('../../helpers/get-user-details')
jest.mock('../../helpers/send-email')

import { mongo } from '@lighthouse/serverless-common'
import { map, omit } from 'lodash/fp'
import * as MockDate from 'mockdate'
import {
  MOCK_APPLICATIONS,
  MOCK_DATA,
  MOCK_EMAIL,
  MOCK_LOCATIONS,
  MOCK_RESULT1,
  MOCK_RESULT2,
  MOCK_USER_DETAILS,
  TZ_LA,
  TZ_NYC,
} from './fixtures'

import { buildEmail } from '../../helpers/build-email'
import { fetchApplications } from '../../helpers/fetch-applications'
import { getUserDetails } from '../../helpers/get-user-details'
import { sendEmail } from '../../helpers/send-email'

import { emailProcessor, userMatchesTimezoneHour } from './'

mongo.getCollection = mockCollection

describe('handlers:emailProcessor', () => {
  afterEach(() => jest.clearAllMocks())

  test('it handles error when getting application users', async () => {
    expect.assertions(1)
    const error = new Error('Error Message')

    mongo.getCollection.mockRejectedValue(error)

    const event = {
      body: '{}',
    }

    await expect(emailProcessor(event)).rejects.toThrow(error)
  })

  test('it returns results when hours matches timezone hour with current time', async () => {
    expect.assertions(12)
    MockDate.set('2018-03-15T16:30:00.000Z')

    const locationsQuerySpy = jest.fn().mockReturnValue(MOCK_LOCATIONS)
    const mockFind = jest
      .fn()
      // applicationUsers
      .mockReturnValueOnce({
        toArray: jest.fn().mockReturnValue(MOCK_DATA),
      })
      // locations
      .mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: locationsQuerySpy,
        }),
      })

    fetchApplications.mockReturnValue(MOCK_APPLICATIONS)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    getUserDetails.mockResolvedValue(MOCK_USER_DETAILS)
    buildEmail.mockResolvedValue(MOCK_EMAIL)
    sendEmail
      .mockResolvedValueOnce(MOCK_RESULT1)
      .mockResolvedValueOnce(MOCK_RESULT2)

    const event = {
      body: '{}',
    }

    await emailProcessor(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(2)
    expect(mongo.getCollection).toBeCalledWith('applicationusers')
    expect(mongo.getCollection).toBeCalledWith('locations')

    // applicationUsers
    expect(mockFind).toBeCalledWith({
      application: {
        $in: ['111111111111111111111111', '222222222222222222222222'],
      },
      deleted: { $ne: true },
      'preferences.notifications.channels': {
        $elemMatch: {
          name: 'daily-location-report',
          enabled: true,
        },
      },
    })

    // locations
    expect(mockFind).toBeCalledWith({
      application: new mongo.ObjectId('111111111111111111111111'),
      deleted: { $ne: true },
    })

    // NOTE The call count should be 1 here which ensures we're memoizing
    // location queries for the same applications
    expect(locationsQuerySpy).toHaveBeenCalledTimes(1)

    expect(getUserDetails).toHaveBeenCalledTimes(2)
    expect(getUserDetails).toBeCalledWith(MOCK_DATA[0])

    expect(buildEmail).toHaveBeenCalledTimes(2)
    expect(buildEmail).toBeCalledWith({
      ...MOCK_USER_DETAILS,
      locations: map(omit('properties'), MOCK_LOCATIONS),
    })

    expect(sendEmail).toHaveBeenCalledTimes(2)
    expect(sendEmail).toBeCalledWith(MOCK_EMAIL)

    MockDate.reset()
  })

  test('it handles errors for one iteration', async () => {
    expect.assertions(2)
    MockDate.set('2018-03-15T16:30:00.000Z')

    const locationsQuerySpy = jest.fn().mockReturnValue(MOCK_LOCATIONS)
    const mockFind = jest
      .fn()
      // applicationUsers
      .mockReturnValueOnce({
        toArray: jest.fn().mockReturnValue(MOCK_DATA),
      })
      // locations
      .mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: locationsQuerySpy,
        }),
      })

    fetchApplications.mockReturnValue(MOCK_APPLICATIONS)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    buildEmail.mockResolvedValue(MOCK_EMAIL)
    sendEmail
      .mockResolvedValueOnce(MOCK_RESULT1)
      .mockResolvedValueOnce(MOCK_RESULT2)

    // NOTE Mimick getUserDetails erroring once
    getUserDetails
      .mockRejectedValueOnce(new Error('SomeError'))
      .mockResolvedValue(MOCK_USER_DETAILS)

    const event = {
      body: '{}',
    }

    await emailProcessor(event)

    expect(getUserDetails).toHaveBeenCalledTimes(2)

    // NOTE sendEmail should be called once because one iteration would have errored
    expect(sendEmail).toHaveBeenCalledTimes(1)

    MockDate.reset()
  })

  test('it returns results when hours matches timezone hour with custom time', async () => {
    expect.assertions(9)
    MockDate.set('2018-03-15T16:30:00.000Z')

    const locationsQuerySpy = jest.fn().mockReturnValue([MOCK_LOCATIONS[2]])
    const mockFind = jest
      .fn()
      // applicationUsers
      .mockReturnValueOnce({
        toArray: jest.fn().mockReturnValue(MOCK_DATA),
      })
      // locations
      .mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: locationsQuerySpy,
        }),
      })

    fetchApplications.mockReturnValue(MOCK_APPLICATIONS)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    getUserDetails.mockResolvedValue({
      email: 'testing2@lighthouse.io',
      firstName: 'Testing 2',
    })
    buildEmail.mockResolvedValue({
      Destination: {
        CcAddresses: [],
        ToAddresses: ['testing2@test.com'],
      },
      ReplyToAddresses: ['support@lighthouse.io'],
      Source: 'support@lighthouse.io',
      Template: 'template-name',
      TemplateData: '',
    })
    sendEmail.mockResolvedValue(MOCK_RESULT1)

    const event = {
      datetime: new Date('2018-03-15T18:30:00.000Z'),
    }

    await emailProcessor(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(2)
    expect(mongo.getCollection).toBeCalledWith('applicationusers')

    expect(mockFind).toBeCalledWith({
      application: {
        $in: ['111111111111111111111111', '222222222222222222222222'],
      },
      deleted: { $ne: true },
      'preferences.notifications.channels': {
        $elemMatch: {
          name: 'daily-location-report',
          enabled: true,
        },
      },
    })

    expect(getUserDetails).toHaveBeenCalledTimes(1)
    expect(getUserDetails).toBeCalledWith(MOCK_DATA[2])

    expect(buildEmail).toHaveBeenCalledTimes(1)
    expect(buildEmail).toBeCalledWith({
      email: 'testing2@lighthouse.io',
      firstName: 'Testing 2',
      locations: map(omit('properties'), [MOCK_LOCATIONS[2]]),
    })

    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toBeCalledWith({
      Destination: {
        CcAddresses: [],
        ToAddresses: ['testing2@test.com'],
      },
      ReplyToAddresses: ['support@lighthouse.io'],
      Source: 'support@lighthouse.io',
      Template: 'template-name',
      TemplateData: '',
    })

    MockDate.reset()
  })

  test('it filters out falsey values when processing users', async () => {
    expect.assertions(3)
    MockDate.set('2018-03-15T16:30:00.000Z')

    const locationsQuerySpy = jest.fn().mockReturnValue(MOCK_LOCATIONS)
    const mockFind = jest
      .fn()
      // applicationUsers
      .mockReturnValueOnce({
        toArray: jest.fn().mockReturnValue(MOCK_DATA),
      })
      // locations
      .mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: locationsQuerySpy,
        }),
      })

    fetchApplications.mockReturnValue(MOCK_APPLICATIONS)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    getUserDetails.mockResolvedValue(false)

    const event = {
      body: '{}',
    }

    await emailProcessor(event)

    expect(getUserDetails).toHaveBeenCalled()
    expect(buildEmail).toHaveBeenCalledTimes(0)
    expect(sendEmail).toHaveBeenCalledTimes(0)
    MockDate.reset()
  })

  test('it filters out falsey values when processing emails', async () => {
    expect.assertions(3)
    MockDate.set('2018-03-15T16:30:00.000Z')

    const locationsQuerySpy = jest.fn().mockReturnValue(MOCK_LOCATIONS)
    const mockFind = jest
      .fn()
      // applicationUsers
      .mockReturnValueOnce({
        toArray: jest.fn().mockReturnValue(MOCK_DATA),
      })
      // locations
      .mockReturnValueOnce({
        sort: jest.fn().mockReturnValue({
          toArray: locationsQuerySpy,
        }),
      })

    fetchApplications.mockReturnValue(MOCK_APPLICATIONS)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    getUserDetails.mockResolvedValue(MOCK_USER_DETAILS)
    buildEmail.mockResolvedValue(false)

    const event = {
      body: '{}',
    }

    await emailProcessor(event)

    expect(getUserDetails).toHaveBeenCalled()
    expect(buildEmail).toHaveBeenCalledTimes(2)
    expect(sendEmail).toHaveBeenCalledTimes(0)
    MockDate.reset()
  })

  describe('userMatchesTimezoneHour', () => {
    test('returns false when user missing dar channel', () => {
      expect.assertions(1)
      const user = {
        _id: '565fe59257c5d59e60cc35a1',
        email: 'testing@lighthouse.io',
        firstName: 'Testing',
        preferences: {
          notifications: {
            channels: [],
          },
        },
      }

      expect(userMatchesTimezoneHour(user, new Date())).toEqual(false)
    })

    test('returns false when user missing dar channel options', () => {
      expect.assertions(1)
      const user = {
        _id: '565fe59257c5d59e60cc35a1',
        email: 'testing@lighthouse.io',
        firstName: 'Testing',
        preferences: {
          notifications: {
            channels: [
              {
                name: 'daily-location-report',
                enabled: true,
              },
            ],
          },
        },
      }

      expect(userMatchesTimezoneHour(user, new Date())).toEqual(false)
    })

    test('returns false when user hours is outside timezone hour', () => {
      expect.assertions(1)
      MockDate.set('2018-03-15T15:30:00.000Z') // LA 2019-03-15T08:30:00.000Z UTC -7

      const user = {
        _id: '565fe59257c5d59e60cc35a1',
        email: 'testing@lighthouse.io',
        firstName: 'Testing',
        preferences: {
          notifications: {
            channels: [
              {
                enabled: true,
                name: 'daily-location-report',
                options: {
                  hours: 9,
                  timezone: TZ_LA,
                },
              },
            ],
          },
        },
      }

      expect(userMatchesTimezoneHour(user, new Date())).toEqual(false)
      MockDate.reset()
    })

    test('returns true when user hours is inside timezone hour', () => {
      expect.assertions(1)
      MockDate.set('2018-03-15T16:15:00.000Z') // LA 2019-03-15T09:15:00.000Z UTC -7

      const user = {
        _id: '565fe59257c5d59e60cc35a1',
        email: 'testing@lighthouse.io',
        firstName: 'Testing',
        preferences: {
          notifications: {
            channels: [
              {
                enabled: true,
                options: {
                  hours: 9,
                  timezone: TZ_LA,
                },
                name: 'daily-location-report',
              },
            ],
          },
        },
      }

      expect(userMatchesTimezoneHour(user, new Date())).toEqual(true)
      MockDate.reset()
    })

    describe('daylight saving time', () => {
      test('is handled when it starts in a timezone', () => {
        expect.assertions(2)

        const user = {
          _id: '565fe59257c5d59e60cc35a1',
          email: 'testing@lighthouse.io',
          firstName: 'Testing',
          preferences: {
            notifications: {
              channels: [
                {
                  name: 'daily-location-report',
                  enabled: true,
                  options: {
                    hours: 6,
                    timezone: TZ_NYC,
                  },
                },
              ],
            },
          },
        }

        // TZ_NYC clocks go forward Sunday, 10th March 2019, 2:00:00 am
        // Before clocks go forward
        MockDate.set('2019-03-09T10:00:00.000Z') // NYC 2019-03-09T05:00:00.000Z UTC -5
        expect(userMatchesTimezoneHour(user, new Date())).toEqual(false)

        // After clocks go forward
        MockDate.set('2019-03-11T10:00:00.000Z') // NYC 2019-03-09T06:00:00.000Z UTC -4
        expect(userMatchesTimezoneHour(user, new Date())).toEqual(true)

        MockDate.reset()
      })

      test('is handled when it ends in a timezone', () => {
        expect.assertions(2)

        const user = {
          _id: '565fe59257c5d59e60cc35a1',
          email: 'testing@lighthouse.io',
          firstName: 'Testing',
          preferences: {
            notifications: {
              channels: [
                {
                  enabled: true,
                  name: 'daily-location-report',
                  options: {
                    hours: 6,
                    timezone: TZ_NYC,
                  },
                },
              ],
            },
          },
        }

        // TZ_NYC clocks go back Sunday, 3 November 2019, 2:00:00 am
        // Before clocks go back
        MockDate.set('2019-11-02T10:00:00.000Z') // NYC 2019-11-02T06:00:00.000Z UTC -4
        expect(userMatchesTimezoneHour(user, new Date())).toEqual(true)

        // After clocks have gone back
        MockDate.set('2019-11-04T10:00:00.000Z') // NYC 2019-11-02T05:00:00.000Z UTC -5
        expect(userMatchesTimezoneHour(user, new Date())).toEqual(false)

        MockDate.reset()
      })
    })
  })
})
