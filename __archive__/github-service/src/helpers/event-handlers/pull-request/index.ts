import { includes } from 'lodash/fp'
import { addHours, startOfHour } from 'date-fns'

import publishToTopic from '../../publish-to-topic'

declare var process: IGithubServiceProcess

const REMINDER_DELETE_TIMEOUT_ACTIONS = ['closed']
const REMINDER_PUT_TIMEOUT_ACTIONS = ['edited', 'opened', 'reopened']

export async function pullRequest({ payload }) {
  const { action, pull_request, repository } = payload

  const isMerged = !!pull_request.merged

  const expiration = addHours(new Date(pull_request.updated_at), 24)
  const bucket = startOfHour(expiration)
  const identifier = `${repository.id}-${pull_request.number}`

  if (includes(action, REMINDER_DELETE_TIMEOUT_ACTIONS) || isMerged) {
    const message = { id: `gprr-${identifier}` }
    const topicArn = process.env.SNS_TOPIC_DELETE_TIMEOUT_ARN
    return await publishToTopic({ message, topicArn })
  }

  if (includes(action, REMINDER_PUT_TIMEOUT_ACTIONS)) {
    const message = {
      bucket: bucket.toISOString(),
      data: {
        attempt: 0,
        payload: {
          htmlUrl: pull_request.html_url,
          title: pull_request.title,
        },
      },
      id: `gprr-${identifier}`,
      expiration: expiration.toISOString(),
      resource: 'github-pull-request-reminder',
    }
    const topicArn = process.env.SNS_TOPIC_PUT_TIMEOUT_ARN
    return await publishToTopic({ message, topicArn })
  }
}

export default pullRequest
