import { getOr } from 'lodash/fp'
import { IncomingWebhook } from '@slack/client'
import { addHours, startOfHour } from 'date-fns'

import { publishToTopic } from '../../helpers'

declare var process: IGithubServiceProcess

export async function pullRequestReminder(event, context, callback) {
  try {
    const message = getOr('{}', 'Records.0.Sns.Message', event)
    const item = JSON.parse(message)

    await updateTimeout(item)
    await sendSlackNotification(item)
    callback()
  } catch (err) {
    callback(err)
  }
}

async function sendSlackNotification(item) {
  const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL)
  const { htmlUrl, title } = item.data.payload

  await webhook.send({
    channel: '#developers',
    icon_emoji: ':alarm_clock:',
    text: `*Github PR Review Reminder*\nThe following PR review is still awaiting review:\nTitle: ${title}\nLink: ${htmlUrl}`,
    username: 'GithubService',
  })
}

async function updateTimeout(item) {
  const expiration = new Date(item.expiration)
  const nextAttempt = item.data.attempt + 1
  const hoursToAdd = 24 * nextAttempt

  const nextExpiration = addHours(expiration, hoursToAdd)
  const nextBucket = startOfHour(nextExpiration)

  // update timeout to the next bucket/expiration
  // datetime and increase the attempt
  const message = {
    ...item,
    bucket: nextBucket.toISOString(),
    data: {
      ...item.data,
      attempt: nextAttempt,
    },
    expiration: nextExpiration.toISOString(),
  }
  const topicArn = process.env.SNS_TOPIC_PUT_TIMEOUT_ARN

  await publishToTopic({ message, topicArn })
}

export default pullRequestReminder
