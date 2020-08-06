const mockToArray = jest.fn().mockReturnValue([])
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })
const mockFindOne = jest.fn().mockReturnValue({})
const mockCollection = jest
  .fn()
  .mockReturnValue({ find: mockFind, findOne: mockFindOne })

import { mongo } from '@lighthouse/serverless-common'
import * as MockDate from 'mockdate'

jest.mock('../../helpers/build-shift-email')
jest.mock('../../helpers/fetch-applications')
jest.mock('../../helpers/get-shift-details')
jest.mock('../../helpers/send-email')

import { buildShiftEmail } from '../../helpers/build-shift-email'
import { fetchApplications } from '../../helpers/fetch-applications'
import { getShiftDetails } from '../../helpers/get-shift-details'
import { sendEmail } from '../../helpers/send-email'

import { shiftEmailProcessor, userMatchesTimezoneHour } from './'
import * as MOCK_DATA from './fixtures'

mongo.getCollection = mockCollection

describe('handlers:shiftEmailProcessor', () => {
  afterEach(() => jest.clearAllMocks())

  test('it handles error when getting application users', async () => {
    expect.assertions(1)
    const error = new Error('Error Message')

    mongo.getCollection.mockRejectedValue(error)

    const event = {
      body: '{}',
    }

    await expect(shiftEmailProcessor(event)).rejects.toThrow(error)
  })

  test('it returns results when hours matches timezone hour with current time', async () => {
    expect.assertions(10)

    MockDate.set('2019-10-10T16:30:00.000Z')
    const datetime = new Date()

    const mockToArray = jest.fn().mockReturnValue(MOCK_DATA.data)
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })

    fetchApplications.mockReturnValue(MOCK_DATA.applications)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    getShiftDetails.mockResolvedValue(MOCK_DATA.user_details)
    buildShiftEmail.mockResolvedValue(MOCK_DATA.email)
    sendEmail.mockResolvedValue(MOCK_DATA.result)

    const event = {
      body: '{}',
    }

    const results = await shiftEmailProcessor(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('applicationusers')

    expect(mockFind).toBeCalledWith({
      application: {
        $in: ['111111111111111111111111', '222222222222222222222222'],
      },
      deleted: { $ne: true },
      'preferences.notifications.channels': {
        $elemMatch: {
          name: 'daily-shift-report',
          enabled: true,
        },
      },
    })

    expect(getShiftDetails).toHaveBeenCalledTimes(1)
    expect(getShiftDetails).toBeCalledWith({
      user: MOCK_DATA.data[0],
      datetime,
    })

    expect(buildShiftEmail).toHaveBeenCalledTimes(1)
    expect(buildShiftEmail).toBeCalledWith({
      userDetails: MOCK_DATA.user_details,
      datetime,
    })

    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toBeCalledWith(MOCK_DATA.email)

    expect(results).toEqual([MOCK_DATA.result])
    MockDate.reset()
  })

  test('it returns results when hours matches timezone hour with custom time', async () => {
    expect.assertions(10)

    const datetime = new Date('2019-12-31T19:00:00.000Z')

    const mockToArray = jest.fn().mockReturnValue(MOCK_DATA.data)
    const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray })

    fetchApplications.mockReturnValue(MOCK_DATA.applications)
    mongo.getCollection.mockResolvedValue({ find: mockFind })
    getShiftDetails.mockResolvedValue({
      email: 'testing2@lighthouse.io',
      firstName: 'Testing 2',
      locations: [
        {
          _id: '565fe59257c5d59e60cc35a2',
          name: 'Testing Location 1',
        },
      ],
    })
    buildShiftEmail.mockResolvedValue({
      Destination: {
        CcAddresses: [],
        ToAddresses: ['testing2@test.com'],
      },
      ReplyToAddresses: ['support@lighthouse.io'],
      Source: 'support@lighthouse.io',
      Template: 'template-name',
      TemplateData: '',
    })
    sendEmail.mockResolvedValue(MOCK_DATA.result)

    const event = {
      datetime: new Date('2019-12-31T19:00:00Z'),
    }

    const results = await shiftEmailProcessor(event)

    expect(mongo.getCollection).toHaveBeenCalledTimes(1)
    expect(mongo.getCollection).toBeCalledWith('applicationusers')

    expect(mockFind).toBeCalledWith({
      application: {
        $in: ['111111111111111111111111', '222222222222222222222222'],
      },
      deleted: { $ne: true },
      'preferences.notifications.channels': {
        $elemMatch: {
          enabled: true,
          name: 'daily-shift-report',
        },
      },
    })

    expect(getShiftDetails).toHaveBeenCalledTimes(1)
    expect(getShiftDetails).toBeCalledWith({
      datetime,
      user: MOCK_DATA.data[1],
    })

    expect(buildShiftEmail).toHaveBeenCalledTimes(1)
    expect(buildShiftEmail).toBeCalledWith({
      datetime,
      userDetails: {
        email: 'testing2@lighthouse.io',
        firstName: 'Testing 2',
        locations: [
          {
            _id: '565fe59257c5d59e60cc35a2',
            name: 'Testing Location 1',
          },
        ],
      },
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

    expect(results).toEqual([MOCK_DATA.result])
    MockDate.reset()
  })

  test('it filters out falsey values when processing users', async () => {
    expect.assertions(2)
    MockDate.set('2019-10-10T16:30:00.000Z')

    getShiftDetails.mockResolvedValue(false)

    const event = {
      body: '{}',
    }

    await shiftEmailProcessor(event)

    expect(buildShiftEmail).toHaveBeenCalledTimes(0)
    expect(sendEmail).toHaveBeenCalledTimes(0)
    MockDate.reset()
  })

  test('it filters out falsey values when processing emails', async () => {
    expect.assertions(3)

    const datetime = new Date('2019-12-31T17:00:00.000Z')
    getShiftDetails.mockResolvedValue(MOCK_DATA.user_details)
    buildShiftEmail.mockResolvedValue(false)

    const event = {
      datetime,
    }

    await shiftEmailProcessor(event)

    expect(buildShiftEmail).toHaveBeenCalledTimes(1)
    expect(buildShiftEmail).toBeCalledWith({
      datetime,
      userDetails: MOCK_DATA.user_details,
    })
    expect(sendEmail).toHaveBeenCalledTimes(0)
    MockDate.reset()
  })

  describe('userMatchesTimezoneHour', () => {
    test('returns false when user missing dsr channel', () => {
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

    test('returns false when user missing dsr channel options', () => {
      expect.assertions(1)
      const user = {
        _id: '565fe59257c5d59e60cc35a1',
        email: 'testing@lighthouse.io',
        firstName: 'Testing',
        preferences: {
          notifications: {
            channels: [
              {
                name: 'daily-shift-report',
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
      MockDate.set('2019-10-10T15:30:00.000Z') // LA 2019-10-10T08:30:00.000Z UTC -7

      const user = {
        _id: '565fe59257c5d59e60cc35a1',
        email: 'testing@lighthouse.io',
        firstName: 'Testing',
        preferences: {
          notifications: {
            channels: [
              {
                enabled: true,
                name: 'daily-shift-report',
                options: {
                  hours: 9,
                  timezone: MOCK_DATA.TZ_LA,
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
      MockDate.set('2019-10-10T16:15:00.000Z') // LA 2019-10-10T09:15:00.000Z UTC -7

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
                  timezone: MOCK_DATA.TZ_LA,
                },
                name: 'daily-shift-report',
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
                  name: 'daily-shift-report',
                  enabled: true,
                  options: {
                    hours: 6,
                    timezone: MOCK_DATA.TZ_NYC,
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
                  name: 'daily-shift-report',
                  options: {
                    hours: 6,
                    timezone: MOCK_DATA.TZ_NYC,
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
