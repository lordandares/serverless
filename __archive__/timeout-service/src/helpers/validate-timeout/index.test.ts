const validateTimeout = require('./').default

describe('validateTimeout', () => {
  it('should throw when missing required keys', () => {
    expect(() => validateTimeout({})).toThrow('Missing required payload values')
  })

  it('should throw when missing bucket', () => {
    const payload = {
      id: '123456789',
      expiration: '2018-08-15T22:00:00.000Z',
      resource: 'testing',
    }

    expect(() => validateTimeout(payload)).toThrow(
      'Missing required payload values',
    )
  })

  it('should throw when missing expiration', () => {
    const payload = {
      bucket: '2018-08-15T22:00:00.000Z',
      id: '123456789',
      resource: 'testing',
    }

    expect(() => validateTimeout(payload)).toThrow(
      'Missing required payload values',
    )
  })

  it('should throw when bucket invalid', () => {
    const payload = {
      bucket: undefined,
      id: '123456789',
      expiration: '2018-08-15T22:00:00.000Z',
      resource: 'testing',
    }

    expect(() => validateTimeout(payload)).toThrow(
      'Bucket value is not a valid date',
    )
  })

  it('should throw when expiration invalid', () => {
    const payload = {
      bucket: '2018-08-15T22:00:00.000Z',
      id: '123456789',
      expiration: 'invalid',
      resource: 'testing',
    }

    expect(() => validateTimeout(payload)).toThrow(
      'Expiration value is not a valid date',
    )
  })
})
