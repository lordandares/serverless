jest.mock('../../publish-to-topic')

import * as MockDate from 'mockdate'

import publishToTopic from '../../publish-to-topic'

import pullRequest from './'

describe('pullRequest', () => {
  const MOCK_SNS_DELETE_TIMEOUT_ARN = 'arn:aws:sns:::delete-function'
  const MOCK_SNS_PUT_TIMEOUT_ARN = 'arn:aws:sns:::put-function'

  beforeEach(() => {
    process.env.SNS_TOPIC_DELETE_TIMEOUT_ARN = MOCK_SNS_DELETE_TIMEOUT_ARN
    process.env.SNS_TOPIC_PUT_TIMEOUT_ARN = MOCK_SNS_PUT_TIMEOUT_ARN
    MockDate.set('2000-01-01T14:16:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should handle edited action', async () => {
    const MOCK_PAYLOAD = {
      action: 'edited',
      pull_request: {
        html_url: 'http://github.com/1',
        number: 1,
        title: 'PR Test',
        updated_at: '2000-01-01T14:16:00.000Z',
      },
      repository: { id: 11111111 },
    }

    await pullRequest({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        bucket: '2000-01-02T14:00:00.000Z',
        data: {
          attempt: 0,
          payload: {
            htmlUrl: 'http://github.com/1',
            title: 'PR Test',
          },
        },
        expiration: '2000-01-02T14:16:00.000Z',
        id: 'gprr-11111111-1',
        resource: 'github-pull-request-reminder',
      },
      topicArn: MOCK_SNS_PUT_TIMEOUT_ARN,
    })
  })

  it('should handle edited action when merged', async () => {
    const MOCK_PAYLOAD = {
      action: 'edited',
      pull_request: {
        merged: true,
        html_url: 'http://github.com/1',
        number: 250,
        title: 'PR Test',
        updated_at: '2000-01-01T14:20:00.000Z',
      },
      repository: { id: 11111111 },
    }

    await pullRequest({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        id: 'gprr-11111111-250',
      },
      topicArn: MOCK_SNS_DELETE_TIMEOUT_ARN,
    })
  })

  it('should handle opened action', async () => {
    const MOCK_PAYLOAD = {
      action: 'opened',
      pull_request: {
        html_url: 'http://github.com/1',
        number: 500,
        title: 'PR Test',
        updated_at: '2000-01-01T14:20:00.000Z',
      },
      repository: { id: 22222222 },
    }

    await pullRequest({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        bucket: '2000-01-02T14:00:00.000Z',
        data: {
          attempt: 0,
          payload: {
            htmlUrl: 'http://github.com/1',
            title: 'PR Test',
          },
        },
        expiration: '2000-01-02T14:20:00.000Z',
        id: 'gprr-22222222-500',
        resource: 'github-pull-request-reminder',
      },
      topicArn: MOCK_SNS_PUT_TIMEOUT_ARN,
    })
  })

  it('should handle reopened action', async () => {
    const MOCK_PAYLOAD = {
      action: 'reopened',
      pull_request: {
        html_url: 'http://github.com/1',
        number: 2000,
        title: 'PR Test',
        updated_at: '2000-01-01T14:10:00.000Z',
      },
      repository: { id: 33333333 },
    }

    await pullRequest({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        bucket: '2000-01-02T14:00:00.000Z',
        data: {
          attempt: 0,
          payload: {
            htmlUrl: 'http://github.com/1',
            title: 'PR Test',
          },
        },
        expiration: '2000-01-02T14:10:00.000Z',
        id: 'gprr-33333333-2000',
        resource: 'github-pull-request-reminder',
      },
      topicArn: MOCK_SNS_PUT_TIMEOUT_ARN,
    })
  })

  it('should handle closed action', async () => {
    const MOCK_PAYLOAD = {
      action: 'closed',
      pull_request: {
        html_url: 'http://github.com/1',
        number: 5000,
        title: 'PR Test',
        updated_at: '2000-01-01T14:10:00.000Z',
      },
      repository: { id: 44444444 },
    }

    await pullRequest({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        id: 'gprr-44444444-5000',
      },
      topicArn: MOCK_SNS_DELETE_TIMEOUT_ARN,
    })
  })

  it('should not handle unknown action', async () => {
    const MOCK_PAYLOAD = {
      action: 'testing',
      pull_request: {
        number: 10000,
        updated_at: '2000-01-01T14:10:00.000Z',
      },
      repository: { id: 55555555 },
    }

    await pullRequest({ payload: MOCK_PAYLOAD })

    expect(publishToTopic).toHaveBeenCalledTimes(0)
  })
})
