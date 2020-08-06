import ApplicationError from './ApplicationError'
import DomainError from './DomainError'

test('valid', () => {
  const error = new ApplicationError({
    message: 'There was a problem with the application',
    data: { foo: 'bar' },
  })
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    data: { foo: 'bar' },
    name: 'ApplicationError',
    message: 'There was a problem with the application',
    status: 500,
  })
})
