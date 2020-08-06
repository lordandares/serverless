import { omit } from 'lodash/fp'
import { ValidationError } from 'yup'
import { HookSchema, hookSchema } from './hookSchema'

const requiredFields = ['endpoint', 'type']

test('valid', () => {
  const data = getValidDocument()
  const validate = hookSchema.validate(data, {
    strict: true,
  })

  return expect(validate).resolves.toBeTruthy()
})

requiredFields.forEach(field => {
  test(`errors when ${field} missing`, () => {
    expect.assertions(1)

    const data = omit(field, getValidDocument())
    const validate = hookSchema.validate(data, {
      strict: true,
    })

    return expect(validate).rejects.toThrowError(ValidationError)
  })
})

test('errors invalid type', () => {
  const data = { ...getValidDocument(), type: 'foo' }
  const validate = hookSchema.validate(data, {
    strict: true,
  })

  return expect(validate).rejects.toThrowError(ValidationError)
})

function getValidDocument(): HookSchema {
  return {
    endpoint: 'hook-endpoint',
    type: 'sns',
  }
}
