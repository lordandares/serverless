import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { TimerPayloadSchema, timerPayloadSchema } from './timerPayloadSchema'

const requiredFields = [
  'scheduleId',
  'datetime',
  'targetArn',
  'targetPk',
  'targetSk',
  'type',
]

test('valid', () => {
  const data = getValidPayload()
  const validate = timerPayloadSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidPayload())
    const validate = timerPayloadSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidPayload(): TimerPayloadSchema {
  return {
    scheduleId: `schedule1`,
    datetime: `2019-01-01T00:00:00.000Z`,
    targetArn: `some:arn`,
    targetPk: 'schedule1',
    targetSk: 'some:Arn',
    type: 'occurrence',
  }
}
