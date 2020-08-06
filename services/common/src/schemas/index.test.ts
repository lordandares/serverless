import { number, object } from 'yup'

import { ValidationError } from '../errors'
import { validate } from './'

test('validate', async () => {
  expect.assertions(1)

  const invalidData = { foo: 'bar' }
  const schema = object().shape({ foo: number() })

  try {
    await validate({ data: invalidData, schema })
  } catch (err) {
    expect(err).toHaveProperty('name', 'ValidationError')
  }
})
