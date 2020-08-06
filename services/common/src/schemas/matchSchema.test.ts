import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { MatchSchema, matchSchema } from './matchSchema'

const requiredFields = ['pk', 'sk']

test('valid', () => {
  const data = getValidDocument()
  const validate = matchSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidDocument())
    const validate = matchSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

function getValidDocument(): MatchSchema {
  return {
    locationId: '1234567890',
    pk: 'application1-occurrence',
    sk: '2019-06-02T00:00:00.000Z-123457890',
  }
}
