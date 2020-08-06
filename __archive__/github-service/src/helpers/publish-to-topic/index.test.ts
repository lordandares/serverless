const mockPublish = jest.fn().mockReturnValue({ promise: jest.fn() })

jest.mock('aws-sdk', () => ({
  SNS: jest.fn().mockImplementation(() => ({
    publish: mockPublish,
  })),
}))

import publishToTopic from './'

describe('publishToTopic', () => {
  afterEach(() => jest.clearAllMocks())

  it('should publish', async () => {
    const MOCK_MESSAGE = { id: '123456789' }
    const MOCK_TOPIC_ARN = 'arn:aws:sns:::function-test'

    await publishToTopic({
      message: MOCK_MESSAGE,
      topicArn: MOCK_TOPIC_ARN,
    })

    expect(mockPublish).toHaveBeenCalledTimes(1)
    expect(mockPublish).toBeCalledWith({
      Message: '{"id":"123456789"}',
      TopicArn: MOCK_TOPIC_ARN,
    })
  })
})
