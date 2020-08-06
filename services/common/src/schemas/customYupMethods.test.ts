import { ValidationError, mixed, object, string } from 'yup'

import { validate } from './'

import './customYupMethods'

it('has custom methods', () => {
  expect.assertions(1)
  expect(mixed.prototype.requiredWhen).toBeTruthy()
})

it('requiredWhen will resolve when isNew context is false and has property', () => {
  expect.assertions(1)

  const schema = object().shape({ test: string().requiredWhen('$isNew') })

  const result = schema.validate(
    { test: 'testing' },
    {
      context: { isNew: false },
      strict: true,
    },
  )

  return expect(result).resolves.toBeTruthy()
})

it('requiredWhen will reject when isNew context is true and missing property', () => {
  expect.assertions(1)

  const schema = object().shape({ test: string().requiredWhen('$isNew') })

  const result = schema.validate(
    {},
    {
      context: { isNew: true },
      strict: true,
    },
  )

  return expect(result).rejects.toThrowError(ValidationError)
})
