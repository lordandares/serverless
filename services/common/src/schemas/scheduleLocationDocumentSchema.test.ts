import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { scheduleLocationDocumentSchema } from './scheduleLocationDocumentSchema'

const requiredFields = [
  'applicationId',
  'createdAt',
  'createdBy',
  'data',
  'groupType',
  'pk',
  'sk',
]

test('valid', () => {
  expect.assertions(1)
  const data = getValidScheduleLocationDocument()
  const validate = scheduleLocationDocumentSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidScheduleLocationDocument())
    const validate = scheduleLocationDocumentSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidScheduleLocationDocument() {
  return {
    applicationId: 'app1',
    createdAt: '2019-10-14T00:00:00.000Z',
    createdBy: {
      id: '123456789',
      label: 'label',
      type: 'system',
    },
    data: {
      name: 'location-1',
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
    pk: 'app1-location',
    schedules: ['schedule1', 'schedule2'],
    sk: 'location1',
    updatedAt: '2019-10-14T00:00:00.000Z',
    updatedBy: {
      id: '123456789',
      label: 'label',
      type: 'system',
    },
  }
}
