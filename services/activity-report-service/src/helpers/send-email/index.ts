import * as AWS from 'aws-sdk'

export async function sendEmail(params) {
  try {
    // NOTE: can only send templated emails from this region
    const sesClient = new AWS.SES({ region: 'us-east-1' })
    const result = await sesClient.sendTemplatedEmail(params).promise()

    return result
  } catch (error) {
    console.error('Error sending email', { error, params })
    return false
  }
}
