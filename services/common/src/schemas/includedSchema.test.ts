import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { IncludedSchema, includedSchema } from './includedSchema'

test('valid', () => {
  const data = getValidDocument()
  const validate = includedSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

function getValidDocument(): IncludedSchema {
  return {
    locations: {
      location1: { name: 'Location One' },
    },
  }
}
