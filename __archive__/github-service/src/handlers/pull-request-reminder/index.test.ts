const mockSend = jest.fn()
const mockIncomingWebhook = jest
  .fn()
  .mockImplementation(() => ({ send: mockSend }))

jest.mock('@slack/client', () => ({
  IncomingWebhook: mockIncomingWebhook,
}))

jest.mock('../../helpers')

import * as MockDate from 'mockdate'

import { publishToTopic } from '../../helpers'

import pullRequestReminder from './'

describe('pullRequestReminder', () => {
  const MOCK_MESSAGE = JSON.stringify({
    bucket: '2000-01-01T14:00:00.000Z',
    data: {
      attempt: 0,
      payload: {
        htmlUrl: 'http://github.com',
        title: 'testing',
      },
    },
    expiration: '2000-01-01T14:15:00.000Z',
    id: 'gprr-123456789',
    resource: 'github-pull-request-reminder',
  })

  const MOCK_SLACK_WEBHOOK_URL = 'http://slack.webhook.url/'
  const MOCK_SNS_PUT_TIMEOUT_ARN = 'arn:aws:sns:::put-function'

  const event = { Records: [{ Sns: { Message: MOCK_MESSAGE } }] }
  const context = {}
  const callback = jest.fn()

  beforeEach(() => {
    process.env.SLACK_WEBHOOK_URL = MOCK_SLACK_WEBHOOK_URL
    process.env.SNS_TOPIC_PUT_TIMEOUT_ARN = MOCK_SNS_PUT_TIMEOUT_ARN
    MockDate.set('2000-01-01T14:16:00.000Z')
  })

  afterEach(() => {
    jest.clearAllMocks()
    MockDate.reset()
  })

  it('should update the timeout', async () => {
    await pullRequestReminder(event, context, callback)

    expect(publishToTopic).toHaveBeenCalledTimes(1)
    expect(publishToTopic).toBeCalledWith({
      message: {
        bucket: '2000-01-02T14:00:00.000Z',
        data: {
          attempt: 1,
          payload: {
            htmlUrl: 'http://github.com',
            title: 'testing',
          },
        },
        expiration: '2000-01-02T14:15:00.000Z',
        id: 'gprr-123456789',
        resource: 'github-pull-request-reminder',
      },
      topicArn: MOCK_SNS_PUT_TIMEOUT_ARN,
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should send a slack notification', async () => {
    await pullRequestReminder(event, context, callback)

    expect(mockIncomingWebhook).toHaveBeenCalledTimes(1)
    expect(mockIncomingWebhook).toBeCalledWith(MOCK_SLACK_WEBHOOK_URL)

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toBeCalledWith({
      channel: '#developers',
      icon_emoji: ':alarm_clock:',
      text:
        '*Github PR Review Reminder*\nThe following PR review is still awaiting review:\nTitle: testing\nLink: http://github.com',
      username: 'GithubService',
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should catch errors', async () => {
    const error = new Error()
    publishToTopic.mockRejectedValue(error)

    await pullRequestReminder(event, context, callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(error)
  })
})
