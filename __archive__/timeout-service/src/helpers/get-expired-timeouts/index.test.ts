const MockDate = require('mockdate')

const getExpiredTimeouts = require('./').default

describe('getExpiredTimeouts', () => {
  const MOCK_RESPONSE = {
    Items: [
      {
        bucket: '1999-12-31T12:00:00.000Z',
        expiration: '1999-12-31T12:45:00.000Z',
        id: '1234567890',
        resource: 'testing',
      },
    ],
  }

  const MOCK_TABLE_TIMEOUTS = 'timeouts'

  beforeEach(() => MockDate.set('2000-01-01T00:00:00.000Z'))
  afterEach(() => MockDate.reset())

  it('should return expired timeouts', async () => {
    const ddb = {
      query: jest.fn().mockReturnValue({
        promise: jest.fn().mockReturnValue(MOCK_RESPONSE),
      }),
    }

    const timeouts = await getExpiredTimeouts({
      ddb,
      table: MOCK_TABLE_TIMEOUTS,
    })

    expect(ddb.query).toHaveBeenCalledTimes(1)
    expect(ddb.query).toBeCalledWith({
      ExpressionAttributeNames: {
        '#B': 'bucket',
        '#E': 'expiration',
      },
      ExpressionAttributeValues: {
        ':b': '1999-12-31T23:00:00.000Z',
        ':e': '1999-12-31T23:59:00.000Z',
      },
      IndexName: 'BucketIndex',
      KeyConditionExpression: '#B = :b and #E <= :e',
      TableName: MOCK_TABLE_TIMEOUTS,
    })

    expect(timeouts).toEqual(MOCK_RESPONSE.Items)
  })
})
