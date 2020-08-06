import { ValidationError } from 'yup'
import { actionSchema } from './actionSchema'

test('valid', () => {
  expect.assertions(1)

  const validate = actionSchema.validate(
    {
      type: 'arn',
      endpoint: 'arn::lambda::id',
      data: {
        foo: 'bar',
      },
    },
    { strict: true },
  )

  return expect(validate).resolves.toBeTruthy()
})

test('missing type', () => {
  expect.assertions(1)

  const validate = actionSchema.validate(
    {
      endpoint: 'endpoint',
      data: {
        foo: 'bar',
      },
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('missing endpoint', () => {
  expect.assertions(1)

  const validate = actionSchema.validate(
    {
      type: 'arn',
      data: {
        foo: 'bar',
      },
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('invalid type', () => {
  expect.assertions(1)

  const validate = actionSchema.validate(
    {
      type: {},
      endpoint: 'endpoint',
      data: {
        foo: 'bar',
      },
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('invalid endpoint', () => {
  expect.assertions(1)

  const validate = actionSchema.validate(
    {
      type: 'arn',
      endpoint: {},
      data: {
        foo: 'bar',
      },
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('invalid data', () => {
  expect.assertions(1)

  const validate = actionSchema.validate(
    {
      type: 'arn',
      endpoint: 'arn::lambda::id',
      data: 'invalid',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})
