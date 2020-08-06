jest.mock('../../publish-to-topic')

import publishToTopic from '../../publish-to-topic'

import pullRequestReview from './'

describe('pullRequestReview', () => {
  const MOCK_SNS_DELETE_TIMEOUT_ARN = 'arn:aws:sns:::delete-function'

  beforeEach(() =>
    (process.env.SNS_TOPIC_DELETE_TIMEOUT_ARN = MOCK_SNS_DELETE_TIMEOUT_ARN))
  afterEach(() => jest.clearAllMocks())

  it('should handle submitted action', async () => {
    const MOCK_PAYLOAD = {
      action: 'submitted',
      pull_request: { number: 1 },
      repository: { id: 11111111 },
    }

    await pullRequestReview({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        id: 'gprr-11111111-1',
      },
      topicArn: MOCK_SNS_DELETE_TIMEOUT_ARN,
    })
  })

  it('should not handle unknown action', async () => {
    const MOCK_PAYLOAD = {
      action: 'testing',
      pull_request: { number: 1 },
      repository: { id: 11111111 },
    }

    await pullRequestReview({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(0)
  })
})
