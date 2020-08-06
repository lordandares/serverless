import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import {
  SchedulePayloadSchema,
  ScheduleResponseSchema,
  schedulePayloadSchema,
  scheduleResponseSchema,
} from './schedulePayloadSchema'

import { scheduling, serviceHours } from '@lighthouse/common'

describe('request payload', () => {
  test('valid', () => {
    const data = getRequestPayload()
    const validate = schedulePayloadSchema.validate(data, {
      strict: true,
    })

    return expect(validate).resolves.toBeTruthy()
  })
})

describe('response payload', () => {
  test('valid', () => {
    const data = getResponsePayload()
    const validate = scheduleResponseSchema.validate(data, {
      strict: true,
    })

    return expect(validate).resolves.toBeTruthy()
  })
})

function getRequestPayload(): SchedulePayloadSchema {
  return {
    areas: [],
    enabled: true,
    endAt: '2019-10-11T00:00:00',
    locations: ['locationId'],
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
    startAt: '2019-10-10T00:00:00',
    strategy: {
      options: {
        duration: { unit: 'minute', value: 15 },
        frequency: { unit: 'minute', value: 15 },
      },
      type: 'stopwatch',
    },
    type: 'visit',
  }
}

function getResponsePayload(): ScheduleResponseSchema {
  return {
    areas: [],
    createdAt: '2019-10-14T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    enabled: true,
    endAt: '2019-10-11T00:00:00',
    id: 'schedule1',
    included: {
      locations: {
        location1: { name: 'Location One' },
      },
    },
    locations: ['locationId'],
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
    startAt: '2019-10-10T00:00:00',
    strategy: {
      options: {
        duration: { unit: 'minute', value: 15 },
        frequency: { unit: 'minute', value: 15 },
      },
      type: 'stopwatch',
    },
    type: 'visit',
    updatedAt: '2019-10-14T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }
}
