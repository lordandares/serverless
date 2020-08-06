import DomainError from './DomainError'
import UnknownError from './UnknownError'

test('valid', () => {
  const error = new UnknownError()
  expect(error).toBeInstanceOf(DomainError)
  expect(error).toMatchObject({
    name: 'UnknownError',
    message:
      'Something went wrong! Try again or contact support if the problem persists.',
    status: 500,
  })
})
