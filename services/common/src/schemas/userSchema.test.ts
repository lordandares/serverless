import { ValidationError } from 'yup'
import { userSchema } from './userSchema'

test('valid user', () => {
  expect.assertions(1)

  const validate = userSchema.validate(
    {
      auth: {
        username: 'joe-bloggs',
      },
      email: 'joe@bloggs.com',
      firstName: 'Joe',
      lastName: 'Bloggs',
    },
    { strict: true },
  )

  return expect(validate).resolves.toMatchSnapshot()
})

test('missing required field', () => {
  expect.assertions(1)

  const validate = userSchema.validate(
    {
      auth: {
        username: 'joe-bloggs',
      },
      email: 'joe@bloggs.com',
      firstName: null,
      lastName: 'Bloggs',
    },
    { strict: true },
  )

  return expect(validate).rejects.toThrowError(ValidationError)
})
