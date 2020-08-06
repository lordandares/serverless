import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { RulePayloadSchema, rulePayloadSchema } from './rulePayloadSchema'

const requiredFields = [
  'applicationId',
  'data',
  'occurrenceId',
  'pk',
  'sk',
  'startAt',
  'type',
]

test('valid', () => {
  const data = getValidPayload()
  const validate = rulePayloadSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidPayload())
    const validate = rulePayloadSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidPayload(): RulePayloadSchema {
  return {
    applicationId: 'application-uuid',
    data: {
      occurrenceInterval: [1580761454998, 1580762054997],
    },
    locationId: 'location-uuid',
    occurrenceId: 'occurrence1',
    pk: 'application1-occurrence',
    sk: '2019-01-01T00:00-occurrence1',
    startAt: '2019-01-01T00:00:00.000Z',
    type: 'visit',
  }
}
