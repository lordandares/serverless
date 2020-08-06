import { noop } from 'lodash'

import { eventTypeHandlerMap, getSecret, verifySignature } from '../../helpers'

declare var process: IGithubServiceProcess

export async function processWebhook(event, context, callback) {
  try {
    const secret = await getSecret(process.env.WEBHOOK_SECRET)
    const signature = event.headers['X-Hub-Signature']

    const isValid = verifySignature({
      body: event.body,
      secret,
      signature,
    })

    if (!isValid) {
      throw new Error('payload signature invalid')
    }

    const body = JSON.parse(event.body)
    const eventType = event.headers['X-GitHub-Event']
    const eventHandler = eventTypeHandlerMap[eventType] || noop

    await eventHandler({ payload: body })
    callback(null, { statusCode: 200 })
  } catch (err) {
    callback(null, {
      body: JSON.stringify({ error: err.message }),
      statusCode: 400,
    })
  }
}

export default processWebhook
