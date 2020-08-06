import { compact, isEmpty } from 'lodash/fp'

export async function sendTimeoutNotifications({ sns, timeouts, resourceMap }) {
  const promises = timeouts.map((item: ITimeout) => {
    if (isEmpty(item)) {
      console.error('sendTimeoutNotifications :: missing item')
      return Promise.resolve()
    }

    const timeoutResource = resourceMap[item.resource] || {}
    const target = timeoutResource.target

    if (!timeoutResource || !target) {
      console.error(
        `sendTimeoutNotifications :: missing target for ${item.resource}`,
      )
      return Promise.resolve()
    }

    const message = JSON.stringify(item)
    const params = { Message: message, TopicArn: target }
    const promise = sns.publish(params).promise()

    return promise
  })

  const snsResponses = await Promise.all(promises)
  return compact(snsResponses)
}

export default sendTimeoutNotifications
