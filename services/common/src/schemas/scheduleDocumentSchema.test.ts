import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import {
  ScheduleDocumentSchema,
  scheduleDocumentSchema,
} from './scheduleDocumentSchema'

const requiredFields = ['data']

test('valid', () => {
  expect.assertions(1)
  const data = getValidSchedule()
  const validate = scheduleDocumentSchema.validate(data, {
    context: { isNew: true },
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing and isNew equals true`, () => {
    expect.assertions(1)

    const data = omit(field, getValidSchedule())
    const validate = scheduleDocumentSchema.validate(data, {
      context: { isNew: true },
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })

  test(`does not error when ${field} missing and isNew equals false`, () => {
    expect.assertions(1)

    const data = omit(field, getValidSchedule())
    const validate = scheduleDocumentSchema.validate(data, {
      context: { isNew: false },
      strict: true,
    })

    return expect(validate).resolves.toBeTruthy()
  })
})

function getValidSchedule(): ScheduleDocumentSchema {
  return {
    applicationId: 'application1',
    createdAt: '2019-10-14T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    data: {
      areas: ['area1'],
      enabled: true,
      included: {
        locations: {
          location1: { name: 'Location One' },
        },
      },
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
          duration: { unit: 'minute', value: 15 },
          frequency: { unit: 'minute', value: 15 },
        },
        type: 'stopwatch',
      },
      type: 'visit',
    },
    endAt: '2019-10-15T00:00:00.000Z',
    groupType: 'schedule',
    pk: 'app1-schedule',
    scheduleId: 'schedule1',
    sk: '2019-10-14T00:00:00.000Z-schedule1',
    startAt: '2019-10-14T00:00:00.000Z',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
  }
}
