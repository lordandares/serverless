import { SNS } from 'aws-sdk'

export async function publishToTopic({ message, topicArn }) {
  const config = { apiVersion: 'latest' }
  const sns = new SNS(config)

  return await sns
    .publish({
      Message: JSON.stringify(message),
      TopicArn: topicArn,
    })
    .promise()
}

export default publishToTopic
