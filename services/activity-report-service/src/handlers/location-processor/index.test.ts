jest.mock('../../helpers/fetch-applications')
jest.mock('../../helpers/fetch-locations')

import * as AWS from 'aws-sdk-mock'
import * as MockDate from 'mockdate'
import * as BPromise from 'bluebird'

import {
  locationProcessor,
  parseApplicationLocations,
  processLocation,
} from './'

import { fetchApplications } from '../../helpers/fetch-applications'
import { fetchLocations } from '../../helpers/fetch-locations'

const TZ_AEST = 'Australia/Melbourne'
const TZ_NYC = 'America/New_York'

AWS.setSDKInstance(require('aws-sdk'))

describe('handlers:locationProcessor', () => {
  beforeAll(() => {
    jest.spyOn(BPromise, 'delay').mockImplementation(Promise.resolve)
  })

  afterEach(() => jest.clearAllMocks())

  describe('locationProcessor', () => {
    beforeEach(() =>
      AWS.mock('StepFunctions', 'startExecution', () => Promise.resolve()),
    )
    afterEach(() => AWS.restore('StepFunctions', 'startExecution'))

    it('should throw an error if the LOCATION_PROCESSOR_ARN environment variable is missing', () => {
      process.env.LOCATION_PROCESSOR_ARN = ''

      const event = {
        body: JSON.stringify({
          datetime: new Date(),
        }),
      }

      expect(locationProcessor(event)).rejects.toThrowError(
        /Missing required environment variables/,
      )
    })

    it('should reject with an error if applications can not be retrieved', () => {
      process.env.LOCATION_PROCESSOR_ARN =
        'arn:aws:lambda:us-east-1:account:function:test'
      fetchApplications.mockRejectedValue(new Error('not found error'))

      const event = {
        body: JSON.stringify({
          datetime: new Date(),
        }),
      }

      expect(locationProcessor(event)).rejects.toThrowError(/not found error/)
    })

    it('should successfully trigger a location activity report with current time', async () => {
      process.env.LOCATION_PROCESSOR_ARN =
        'arn:aws:lambda:us-east-1:account:function:test'

      // NOTE: outside of dst for AEST timezone
      MockDate.set('2018-11-09T04:45:00.000Z')

      const event = {}

      const applications = [
        {
          _id: '5c0efa65fc13ae1540000000',
          name: 'Lighthouse',
        },
      ]

      const locations = [
        {
          _id: '5c0efa65fc13ae1540000001',
          activityReportTriggerTime: {
            hours: 15, // in range
            minutes: 0,
          },
          application: '5c0efa65fc13ae1540000000',
          timezone: TZ_AEST,
        },
        {
          _id: '5c0efa65fc13ae1540000002',
          activityReportTriggerTime: {
            hours: 16, // out of range by hour
            minutes: 0,
          },
          application: '5c0efa65fc13ae1540000000',
          timezone: TZ_AEST,
        },
        {
          _id: '5c0efa65fc13ae1540000003',
          activityReportTriggerTime: {
            hours: 14, // out of range by hour
            minutes: 0,
          },
          application: '5c0efa65fc13ae1540000000',
          timezone: TZ_AEST,
        },
      ]

      fetchApplications.mockResolvedValue(applications)
      fetchLocations.mockResolvedValue(locations)

      const results = await locationProcessor(event)
      expect(results).toMatchSnapshot()
    })

    it('should successfully trigger a location activity report with custom time', async () => {
      process.env.LOCATION_PROCESSOR_ARN =
        'arn:aws:lambda:us-east-1:account:function:test'

      const event = {
        body: JSON.stringify({
          datetime: new Date('2018-11-09T05:45:00.000Z'),
        }),
      }

      const applications = [
        {
          _id: '5c0efa65fc13ae1540000000',
          name: 'Lighthouse',
        },
      ]

      const locations = [
        {
          _id: '5c0efa65fc13ae1540000001',
          activityReportTriggerTime: {
            hours: 15, // out of range by hour
            minutes: 0,
          },
          application: '5c0efa65fc13ae1540000000',
          timezone: TZ_AEST,
        },
        {
          _id: '5c0efa65fc13ae1540000002',
          activityReportTriggerTime: {
            hours: 16, // in range
            minutes: 0,
          },
          application: '5c0efa65fc13ae1540000000',
          timezone: TZ_AEST,
        },
        {
          _id: '5c0efa65fc13ae1540000003',
          activityReportTriggerTime: {
            hours: 14, // out of range by hour
            minutes: 0,
          },
          application: '5c0efa65fc13ae1540000000',
          timezone: TZ_AEST,
        },
      ]

      fetchApplications.mockResolvedValue(applications)
      fetchLocations.mockResolvedValue(locations)

      const results = await locationProcessor(event)
      expect(results).toMatchSnapshot()
    })
  })

  describe('parseApplicationLocations', () => {
    it('should return an empty array if no application locations are passed', () => {
      expect.assertions(1)

      const applicationLocations = []

      expect(
        parseApplicationLocations(applicationLocations, new Date()),
      ).toEqual([])
    })

    it('should return an empty array if application locations missing trigger time or timezone', () => {
      expect.assertions(1)

      const applicationLocations = [
        {
          _id: 1,
          activityReportTriggerTime: {
            hours: 15,
            minutes: 0,
          },
          application: 101,
        },
        {
          _id: 2,
          application: 101,
          timezone: TZ_AEST,
        },
      ]

      expect(
        parseApplicationLocations(applicationLocations, new Date()),
      ).toEqual([])
    })

    it('should process application locations', () => {
      expect.assertions(1)

      // NOTE: outside of dst for AEST timezone
      MockDate.set('2018-11-09T16:30:00.000Z')

      const applicationLocationArray = [
        {
          _id: 1,
          activityReportTriggerTime: {
            hours: 3, // in range
            minutes: 0,
          },
          application: 101,
          timezone: TZ_AEST,
        },
        {
          _id: 2,
          activityReportTriggerTime: {
            hours: 3, // in range
            minutes: 0,
          },
          application: 101,
          timezone: TZ_AEST,
        },
        {
          _id: 3,
          activityReportTriggerTime: {
            hours: 4, // out of range by one hour
            minutes: 0,
          },
          application: 101,
          timezone: TZ_AEST,
        },
        {
          _id: 4,
          activityReportTriggerTime: {
            hours: 2, // out of range by one hour
            minutes: 0,
          },
          application: 101,
          timezone: TZ_AEST,
        },
      ]

      const applicationLocations = [applicationLocationArray]
      const locationsToProcess = parseApplicationLocations(
        applicationLocations,
        new Date(),
      )
      expect(locationsToProcess).toMatchSnapshot()
      MockDate.reset()
    })

    describe('daylight saving time', () => {
      it('is handled when it starts in a timezone', () => {
        expect.assertions(3)

        // TZ_NYC clocks go forward Sunday, 10th March 2019, 2:00:00 am
        const applicationLocationArray = [
          {
            _id: 1,
            activityReportTriggerTime: {
              hours: 6,
              minutes: 0,
            },
            application: 101,
            timezone: TZ_NYC,
          },
        ]
        const applicationLocations = [applicationLocationArray]

        // Before clocks go forward
        MockDate.set('2019-03-09T10:00:00.000Z') // NYC 2019-03-09T05:00:00.000Z UTC -5
        const locationsToProcessBefore = parseApplicationLocations(
          applicationLocations,
          new Date(),
        )
        expect(locationsToProcessBefore.length).toEqual(0)

        // After clocks go forward
        MockDate.set('2019-03-11T10:00:00.000Z') // NYC 2019-03-09T06:00:00.000Z UTC -4
        const locationsToProcessAfter = parseApplicationLocations(
          applicationLocations,
          new Date(),
        )
        expect(locationsToProcessAfter.length).toEqual(1)
        expect(locationsToProcessAfter).toMatchSnapshot()
        MockDate.reset()
      })

      it('is handled when it ends in a timezone', () => {
        expect.assertions(3)

        // TZ_NYC clocks go back Sunday, 3 November 2019, 2:00:00 am
        const applicationLocationArray = [
          {
            _id: 1,
            activityReportTriggerTime: {
              hours: 6,
              minutes: 0,
            },
            application: 101,
            timezone: TZ_NYC,
          },
        ]
        const applicationLocations = [applicationLocationArray]

        // Before clocks go back
        MockDate.set('2019-11-02T10:00:00.000Z') // NYC 2019-11-02T06:00:00.000Z UTC -4
        const locationsToProcessBefore = parseApplicationLocations(
          applicationLocations,
          new Date(),
        )

        expect(locationsToProcessBefore.length).toEqual(1)
        expect(locationsToProcessBefore).toMatchSnapshot()

        // After clocks have gone back
        MockDate.set('2019-11-04T10:00:00.000Z') // NYC 2019-11-02T05:00:00.000Z UTC -5
        const locationsToProcessAfter = parseApplicationLocations(
          applicationLocations,
          new Date(),
        )
        expect(locationsToProcessAfter.length).toEqual(0)
        MockDate.reset()
      })
    })
  })

  describe('processLocation', () => {
    beforeEach(() => {
      process.env.MONGODB_SECRET_ID = 'lio/application/service/environment'

      AWS.mock(
        'StepFunctions',
        'startExecution',
        // NOTE: Just returning the params here,
        // as no need to test the aws-sdk
        (params, cb) => cb(null, params),
      )
    })

    afterEach(() => AWS.restore('StepFunctions', 'startExecution'))

    it('should error if LOCATION_PROCESSOR_ARN is missing', () => {
      process.env.LOCATION_PROCESSOR_ARN = ''

      expect(() => processLocation({})).toThrowError(
        /Missing LOCATION_PROCESSOR_ARN/,
      )
    })

    it('should process location', async () => {
      process.env.LOCATION_PROCESSOR_ARN =
        'arn:aws:lambda:us-east-1:account:function:test'
      const location = { _id: 1, application: 2 }

      const expectedResponse = {
        input: JSON.stringify(location),
        stateMachineArn: 'arn:aws:lambda:us-east-1:account:function:test',
      }

      const processed = await processLocation(location)

      expect(processed).toEqual(expectedResponse)
    })
  })
})
