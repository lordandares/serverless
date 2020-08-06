/* istanbul ignore file */

import { SNSEvent } from 'aws-lambda'

import { getOr } from 'lodash/fp'

interface Result {
  body: { [name: string]: any }
  messageId: string
  topicArn: string
}

export default function parseSnsEvent(event: SNSEvent): Result {
  const message = getOr({}, 'Records.0.Sns.Message', event)
  const body = JSON.parse(message)
  const messageId = getOr('unknown', 'Records.0.Sns.MessageId', event)
  const topicArn = getOr('unknown', 'Records.0.Sns.TopicArn', event)

  return { body, messageId, topicArn }
}
