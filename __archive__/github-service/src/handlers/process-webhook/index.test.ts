jest.mock('lodash')
jest.mock('../../helpers')

import { noop } from 'lodash'

import { eventTypeHandlerMap, getSecret, verifySignature } from '../../helpers'

import processWebhook from './'

describe('processWebhook', () => {
  const MOCK_BODY = { pull_request: { title: 'test' } }
  const MOCK_EVENT = 'pull_request'
  const MOCK_SECRET = '123456789'
  const MOCK_SIGNATURE = '112233445566'
  const MOCK_WEBHOOK_SECRET = '123456789'

  const context = {}
  const callback = jest.fn()

  beforeEach(() => (process.env.WEBHOOK_SECRET = MOCK_WEBHOOK_SECRET))
  afterEach(() => jest.clearAllMocks())

  it('should process event', async () => {
    getSecret.mockReturnValue(MOCK_SECRET)
    verifySignature.mockReturnValue(true)

    const event = {
      headers: {
        'X-GitHub-Event': MOCK_EVENT,
        'X-Hub-Signature': MOCK_SIGNATURE,
      },
      body: JSON.stringify(MOCK_BODY),
    }

    await processWebhook(event, context, callback)

    expect(getSecret).toHaveBeenCalledTimes(1)
    expect(getSecret).toBeCalledWith(MOCK_WEBHOOK_SECRET)

    expect(verifySignature).toHaveBeenCalledTimes(1)
    expect(verifySignature).toBeCalledWith({
      body: JSON.stringify(MOCK_BODY),
      secret: MOCK_SECRET,
      signature: MOCK_SIGNATURE,
    })

    expect(eventTypeHandlerMap.pull_request).toHaveBeenCalledTimes(1)
    expect(eventTypeHandlerMap.pull_request).toBeCalledWith({
      payload: MOCK_BODY,
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(null, { statusCode: 200 })
  })

  it('should handle unknown event types', async () => {
    getSecret.mockReturnValue(MOCK_SECRET)
    verifySignature.mockReturnValue(true)

    const event = {
      headers: {
        'X-GitHub-Event': 'unknown-event',
        'X-Hub-Signature': MOCK_SIGNATURE,
      },
      body: JSON.stringify(MOCK_BODY),
    }

    await processWebhook(event, context, callback)

    expect(noop).toHaveBeenCalledTimes(1)
    expect(noop).toBeCalledWith({
      payload: MOCK_BODY,
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(null, { statusCode: 200 })
  })

  it('should catch error when payload is invalid', async () => {
    verifySignature.mockReturnValue(false)

    const event = {
      headers: {
        'X-GitHub-Event': MOCK_EVENT,
        'X-Hub-Signature': MOCK_SIGNATURE,
      },
      body: JSON.stringify(MOCK_BODY),
    }

    await processWebhook(event, context, callback)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(null, {
      body: '{"error":"payload signature invalid"}',
      statusCode: 400,
    })
  })
})
