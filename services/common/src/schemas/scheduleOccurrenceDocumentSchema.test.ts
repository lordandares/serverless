import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { scheduleOccurrenceDocumentSchema } from './scheduleOccurrenceDocumentSchema'

const requiredFields = [
  'location_endAt_occurrenceId',
  'locationId',
  'occurrenceId',
  'status',
]

test('valid', () => {
  expect.assertions(1)
  const data = getValidScheduleOccurrence()
  const validate = scheduleOccurrenceDocumentSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing and isNew equals true`, () => {
    expect.assertions(1)

    const data = omit(field, getValidScheduleOccurrence())
    const validate = scheduleOccurrenceDocumentSchema.validate(data, {
      context: { isNew: true },
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })

  test(`does not error when ${field} missing and isNew equals false`, () => {
    expect.assertions(1)

    const data = omit(field, getValidScheduleOccurrence())
    const validate = scheduleOccurrenceDocumentSchema.validate(data, {
      context: { isNew: true },
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidScheduleOccurrence() {
  return {
    applicationId: 'app1',
    createdAt: '2019-10-14T00:00:00.000Z',
    createdBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    endAt: '2019-10-15T00:00:00.000Z',
    groupType: 'occurrence',
    locationId: 'location1',
    location_endAt_occurrenceId:
      'location1-2019-10-15T00:00:00.000Z-occurrence1',
    occurrenceId: 'occurrence1',
    pk: 'app1-occurrence',
    scheduleId: 'schedule1',
    sk: '2019-10-14T00:00:00.000Z-occurrence1',
    startAt: '2019-10-14T00:00:00.000Z',
    status: 'pending',
    updatedBy: {
      id: 'user1',
      label: 'Unknown User',
      type: 'user',
    },
    user_endAt_occurrenceId: 'user1-2019-10-15T00:00:00.000Z-occurrence1',
  }
}
