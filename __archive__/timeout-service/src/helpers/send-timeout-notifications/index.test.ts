const sendTimeoutNotifications = require('./').default

describe('sendTimeoutNotifications', () => {
  const MOCK_RESOURCE_MAP = {
    heartbeat: {
      id: 'heartbeat',
      target: 'arn:aws:::heartbeat',
    },
    loops: {
      id: 'loops',
      target: 'arn:aws:::loops',
    },
    noTarget: {
      id: 'loops',
    },
  }

  const MOCK_TRIGGER_RESPONSE = {
    MessageId: '47a38cbe-2047-5056-a615-dce56aecc0c1',
    ResponseMetadata: {
      RequestId: '3b4e8c82-976c-55da-b1fa-dcd9ddc7254d',
    },
  }

  afterEach(() => jest.clearAllMocks())

  it('should trigger for each valid resource', async () => {
    const MOCK_TIMEOUTS = [
      {
        bucket: '2018-08-15T22:00:00.000Z',
        expiration: '2018-08-15T21:30:00.000Z',
        id: '1234567890',
        resource: 'heartbeat',
      },
      {
        bucket: '2018-08-15T22:00:00.000Z',
        expiration: '2018-08-15T21:36:00.000Z',
        id: '1234567891',
        resource: 'loops',
      },
    ]

    const sns = {
      publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(MOCK_TRIGGER_RESPONSE),
      }),
    }

    const snsResponses = await sendTimeoutNotifications({
      sns,
      timeouts: MOCK_TIMEOUTS,
      resourceMap: MOCK_RESOURCE_MAP,
    })

    expect(sns.publish).toHaveBeenCalledTimes(2)
    expect(sns.publish).toBeCalledWith({
      Message: JSON.stringify(MOCK_TIMEOUTS[0]),
      TopicArn: 'arn:aws:::heartbeat',
    })

    expect(sns.publish).toBeCalledWith({
      Message: JSON.stringify(MOCK_TIMEOUTS[1]),
      TopicArn: 'arn:aws:::loops',
    })

    expect(snsResponses).toEqual([MOCK_TRIGGER_RESPONSE, MOCK_TRIGGER_RESPONSE])
  })

  it('should skip timeouts which are malformed', async () => {
    const MOCK_TIMEOUTS = [
      {
        bucket: '2018-08-15T22:00:00.000Z',
        expiration: '2018-08-15T21:30:00.000Z',
        id: '1234567890',
        resource: 'no-mapping',
      },
      {
        bucket: '2018-08-15T22:00:00.000Z',
        expiration: '2018-08-15T21:36:00.000Z',
        id: '1234567891',
        resource: 'noTarget',
      },
      {},
      null,
    ]

    const sns = {
      publish: jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(MOCK_TRIGGER_RESPONSE),
      }),
    }

    const snsResponses = await sendTimeoutNotifications({
      sns,
      timeouts: MOCK_TIMEOUTS,
      resourceMap: MOCK_RESOURCE_MAP,
    })

    expect(sns.publish).toHaveBeenCalledTimes(0)
    expect(snsResponses).toEqual([])
  })
})
