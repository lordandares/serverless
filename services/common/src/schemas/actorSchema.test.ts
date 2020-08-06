import { ValidationError } from 'yup'
import { actorSchema } from './actorSchema'

test('valid', () => {
  expect.assertions(1)

  const validate = actorSchema.validate(
    {
      id: 'userId',
      type: 'user',
      label: 'John Smith',
    },
    { strict: true },
  )

  return expect(validate).resolves.toBeTruthy()
})

test('missing id', () => {
  expect.assertions(1)

  const validate = actorSchema.validate(
    {
      type: 'user',
      label: 'John Smith',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('missing type', () => {
  expect.assertions(1)

  const validate = actorSchema.validate(
    {
      id: 'userId',
      label: 'John Smith',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('invalid id', () => {
  expect.assertions(1)

  const validate = actorSchema.validate(
    {
      id: {},
      type: 'user',
      label: 'John Smith',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})

test('invalid type', () => {
  expect.assertions(1)

  const validate = actorSchema.validate(
    {
      id: 'userId',
      type: {},
      label: 'John Smith',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})
