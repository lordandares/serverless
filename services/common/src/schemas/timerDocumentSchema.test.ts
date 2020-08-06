import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { TimerDocumentSchema, timerDocumentSchema } from './timerDocumentSchema'

const requiredFields = [
  'pk',
  'sk',
  'expiresAt',
  'groupType',
  'scheduleId',
  'targetArn',
]

test('valid', () => {
  const data = getValidPayload()
  const validate = timerDocumentSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidPayload())
    const validate = timerDocumentSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidPayload(): TimerDocumentSchema {
  return {
    pk: 'timer-2019-01-01T00:00',
    sk: 'timer#application1-occurrence#2019-01-01T00:00-occurrence',
    expiresAt: '2019-01-01T23:59:59.999Z',
    groupType: 'occurrence-timer',
    scheduleId: 'schedule1',
    targetArn: 'some:Arn',
  }
}
