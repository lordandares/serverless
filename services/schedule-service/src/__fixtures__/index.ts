import { Context } from 'aws-lambda'

export const areaDocument = {
  _id: 'location1',
  address: {
    city: 'Bethesda',
    country: 'US',
    postal: '20889',
    state: 'MD',
    street: '8901 Rockville Pike',
    street2: '',
  },
  altName: 'WRNMMC Facility',
  application: '56789671d4c6488b128c7f9c',
  areaSize: 536559.55514508,
  deleted: false,
  floorsRef: [0],
  groupType: 'location',
  keywords: ['hospital'],
  name: 'WRNMMC Facility',
  serviceHours: {
    hours: [
      {
        description: 'MON 00:00 - TUE 00:00',
        duration: 86400000,
        end: 86400000,
        start: 0,
        type: 'DEFAULT',
      },
    ],
    timezone: 'America/New_York',
  },
  tags: [],
  timezone: 'America/New_York',
}

export const occurrenceDocument = {
  applicationId: 'application1',
  createdAt: '2019-01-01T00:00:00.000Z',
  createdBy: {
    id: 'user1',
    label: 'Unknown User',
    type: 'user',
  },
  data: {
    occurrenceInterval: [1, 2],
    scheduleName: 'Schedule 1',
    serviceInterval: [1, 2],
    timezone: 'Australia/Melbourne',
    type: 'visit',
  },
  endAt: '2019-02-01T23:59:59.999Z',
  groupType: 'occurrence',
  locationId: '5d163137b8b3b7000127edd1',
  location_endAt_occurrenceId: 'location1-2019-02-02T00:00:00.000Z-occurrence1',
  occurrenceId: 'occurrence1',
  pk: 'application1-occurrence',
  scheduleId: 'schedule1',
  sk: '2019-01-01T00:00-occurrence1',
  startAt: '2019-02-01T00:00:00.000Z',
  status: 'pending',
  updatedBy: {
    id: 'user1',
    label: 'Unknown User',
    type: 'user',
  },
}

export const occurrenceTimerDocument = {
  pk: `timer-2019-01-01T00:00`,
  sk: `timer#application1-occurrence#2019-01-01T00:00-occurrence`,
  endAt: '2019-01-01T23:59:59.999Z',
  groupType: `occurrence-timer`,
  scheduleId: 'schedule1',
  targetArn: 'someArn',
}

export const scheduleDocument = {
  applicationId: 'application1',
  createdAt: '2019-10-13T00:00:00.000Z',
  createdBy: {
    id: 'user1',
    label: 'Unknown User',
    type: 'user',
  },
  data: {
    areas: ['area1'],
    enabled: true,
    included: {},
    locations: ['location1'],
    name: 'Schedule One',
    serviceHours: {
      hours: [
        {
          description: 'MON 11:00 - TUE 00:00',
          end: 86400000,
          start: 39600000,
          type: 'DEFAULT',
        },
      ],
      timezone: 'Australia/Melbourne',
    },
    strategy: {
      options: {
        duration: {
          unit: 'minute',
          value: 15,
        },
        frequency: {
          unit: 'minute',
          value: 15,
        },
      },
      type: 'stopwatch',
    },
    type: 'visit',
  },
  endAt: '2019-10-1500:00:00.000Z',
  groupType: 'schedule',
  pk: 'application1-schedule',
  scheduleId: 'schedule1',
  sk: '2019-10-13T00:00:00.000Z-schedule1',
  startAt: '2019-10-1400:00:00.000Z',
  updatedAt: '2019-10-13T01:00:00.000Z',
  updatedBy: {
    id: 'user1',
    label: 'Unknown User',
    type: 'user',
  },
}

export const scheduleLocationDocument = {
  applicationId: 'application1',
  createdAt: '2019-10-13T00:00:00.000Z',
  createdBy: {
    id: '123456789',
    label: 'label',
    type: 'system',
  },
  data: {
    name: 'Schedule One',
    serviceHours: {
      hours: [
        {
          description: 'MON 11:00 - TUE 00:00',
          end: 86400000,
          start: 39600000,
          type: 'DEFAULT',
        },
      ],
      timezone: 'Australia/Melbourne',
    },
  },
  groupType: 'location',
  pk: 'application1-location',
  schedules: ['schedule1'],
  sk: 'location1',
  updatedAt: '2019-10-13T01:00:00.000Z',
  updatedBy: {
    id: '123456789',
    label: 'label',
    type: 'system',
  },
}

export const schedulePayload = {
  areas: ['area1'],
  enabled: true,
  endAt: '2019-10-1500:00:00.000Z',
  locations: ['location1'],
  name: 'Schedule One',
  serviceHours: {
    hours: [
      {
        description: 'MON 11:00 - TUE 00:00',
        end: 86400000,
        start: 39600000,
        type: 'DEFAULT',
      },
    ],
    timezone: 'Australia/Melbourne',
  },
  startAt: '2019-10-1400:00:00.000Z',
  strategy: {
    options: {
      duration: {
        unit: 'minute',
        value: 15,
      },
      frequency: {
        unit: 'minute',
        value: 15,
      },
    },
    type: 'stopwatch',
  },
  type: 'visit',
}

export const rulePayload = {
  applicationId: 'application-id-1111',
  data: {
    occurrenceInterval: [1580761454998, 1580762054997],
  },
  hook: {
    endpoint: 'sns:endpoint:uri',
    type: 'sns',
  },
  locationId: 'location-id-11111',
  occurrenceId: 'occurrence1',
  pk: 'application1-occurrence',
  scheduleId: 'schedule1',
  sk: '2019-06-02T00:00:00.000Z-occurrence1',
  startAt: '2019-02-01T00:00:00.000Z',
  type: 'visit',
}

export const rulePatternDocument = {
  createdAt: '2019-06-02T00:00:00.000Z',
  createdBy: {
    id: 'created-by-id-11111',
    label: 'created-by-label-1111',
    type: 'created-by-type-11111',
  },
  groupType: 'rule-pattern',
  matches: {
    occurrence1: {
      pk: 'application1-occurrence',
      sk: '2019-06-01T00:00:00.000Z-occurrence1',
    },
  },
  pk: 'rule-pattern-application-id-11111-location-id-11111',
  sk: 'visit',
  updatedAt: '2019-06-02T00:00:00.000Z',
}

export const context: Context = {
  awsRequestId: 'aws-request-id',
  callbackWaitsForEmptyEventLoop: false,
  clientContext: undefined,
  done: jest.fn(),
  fail: jest.fn(),
  functionName: 'function-name',
  functionVersion: 'function-version',
  getRemainingTimeInMillis: jest.fn(),
  identity: undefined,
  invokedFunctionArn: 'invoked-function-arn',
  logGroupName: 'log-group-name',
  logStreamName: 'log-stream-name',
  memoryLimitInMB: 0,
  succeed: jest.fn(),
}
