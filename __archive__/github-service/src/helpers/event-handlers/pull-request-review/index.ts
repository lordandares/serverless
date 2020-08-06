import { includes } from 'lodash/fp'

import publishToTopic from '../../publish-to-topic'

declare var process: IGithubServiceProcess

const REMINDER_DELETE_TIMEOUT_ACTIONS = ['submitted']

export async function pullRequestReview({ payload }) {
  const { action, pull_request, repository } = payload

  const identifier = `${repository.id}-${pull_request.number}`

  if (includes(action, REMINDER_DELETE_TIMEOUT_ACTIONS)) {
    const message = { id: `gprr-${identifier}` }
    const topicArn = process.env.SNS_TOPIC_DELETE_TIMEOUT_ARN
    return publishToTopic({ message, topicArn })
  }
}

export default pullRequestReview
