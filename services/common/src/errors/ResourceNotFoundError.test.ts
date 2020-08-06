import DomainError from './DomainError'
import ResourceNotFoundError from './ResourceNotFoundError'

test('valid', () => {
  const error = new ResourceNotFoundError({ resource: 'Dog', id: 'dog1' })
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    name: 'ResourceNotFoundError',
    message: 'The Resource "Dog" with ID of "dog1" could not be found',
    status: 404,
  })
})

test('fallback id', () => {
  const error = new ResourceNotFoundError({ resource: 'Dog' })
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    name: 'ResourceNotFoundError',
    message: 'The Resource "Dog" with ID of "Unknown" could not be found',
    status: 404,
  })
})

test('attaches data', () => {
  const error = new ResourceNotFoundError({
    resource: 'Cat',
    id: 'cat2',
    data: { furry: true },
  })
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    name: 'ResourceNotFoundError',
    message: 'The Resource "Cat" with ID of "cat2" could not be found',
    status: 404,
    data: {
      id: 'cat2',
      furry: true,
      resource: 'Cat',
    },
  })
})
