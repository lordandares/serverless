// eslint-disable-next-line no-unused-vars
import { Callback, Context, Handler } from 'aws-lambda'
import { SES } from 'aws-sdk'
import * as nodemailer from 'nodemailer'
import handleSendEmail from './src/handle-send-email'

export function run(event, context: Context, callback: Callback): Handler {
  console.log('send-email', { event })

  const ses = new SES({
    // NOTE SES is not available in ap-southeast-2
    region: 'us-east-1',
  })

  const transporter = nodemailer.createTransport({
    SES: ses,
  })

  const isJson = typeof event.body === 'string'
  const data = isJson ? JSON.parse(event.body) : event

  return handleSendEmail(transporter, data)
    .then(result => {
      console.log('send-email:result', { result })
      // NOTE We don't pass the result to the callback as it can trigger the
      // step function max character limit
      return callback(null)
    })
    .catch(err => {
      console.error('send-email:error', { err })
      return callback(err)
    })
}
