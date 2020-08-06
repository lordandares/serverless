import * as errors from './'

describe('isKnownError', () => {
  test('returns true for known error', () => {
    const result = errors.isKnownError(
      new errors.ApplicationError({ message: 'Invalid arguments' }),
    )

    expect(result).toBe(true)
  })

  test('returns false for unknown error', () => {
    const result = errors.isKnownError(new Error('SomeError'))

    expect(result).toBe(false)
  })
})

describe('httpErrorHandler', () => {
  test('known error', () => {
    const err = new errors.ValidationError({ message: 'Invalid arguments' })
    const result = errors.httpErrorHandler(err)

    expect(result).toEqual({
      body: JSON.stringify({
        ...err,
        message: 'Invalid arguments',
      }),
      statusCode: 400,
    })
  })

  test('unknown error', () => {
    const err = new Error('SomeError')
    const unknownError = new errors.UnknownError()
    const result = errors.httpErrorHandler(err)

    expect(result).toEqual({
      body: JSON.stringify({
        ...unknownError,
        message:
          'Something went wrong! Try again or contact support if the problem persists.',
      }),
      statusCode: 500,
    })
  })

  test('without status', () => {
    const err = new errors.DomainError('LighthouseError')
    const result = errors.httpErrorHandler(err)

    expect(result).toEqual({
      body: JSON.stringify({
        ...err,
        message: 'LighthouseError',
      }),
      statusCode: 500,
    })
  })
})
