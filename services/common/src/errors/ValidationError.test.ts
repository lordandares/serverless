import { omit } from 'lodash/fp'
import { object, string } from 'yup'
import DomainError from './DomainError'
import ValidationError from './ValidationError'

test('valid with message', () => {
  const error = new ValidationError({
    message: 'The field `id` is required',
  })
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    name: 'ValidationError',
    message: 'The field `id` is required',
    status: 400,
  })
})

test('valid without message', () => {
  const error = new ValidationError({ data: { valid: false } })
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    name: 'ValidationError',
    data: { valid: false },
    message:
      'The data you submitted was invalid. Please try again with valid data.',
    status: 400,
  })
})

test('schema ValidationError', () => {
  const schema = object().shape({
    type: string().required(),
  })

  try {
    schema.validateSync({}, { strict: true })
  } catch (err) {
    const wrappedError = new ValidationError({ data: err })
    expect(wrappedError).toMatchObject({
      name: 'ValidationError',
      message: err.message,
      data: omit(['name', 'message'], err),
    })
  }
})
