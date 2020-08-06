import { assign, flow, omit } from 'lodash/fp'

interface Data {
  attachment: {
    filename: string
    url: string
  }
  cc: string[]
  from: string
  html: string
  subject: string
  to: string[]
}

export default function handleSendEmail(transporter, data: Data) {
  if (!transporter) {
    return Promise.reject(new Error('Missing `transporter` argument'))
  }

  if (!validate(data)) {
    console.error('Invalid data supplied to sendEmail', { data })
    return Promise.reject(new Error('Invalid data supplied to sendEmail'))
  }

  const attachments = [
    {
      filename: data.attachment.filename,
      path: data.attachment.url,
    },
  ]

  const transportData = flow(
    omit('attachment'),
    assign({ attachments }),
  )(data)

  return transporter.sendMail(transportData).catch(err => {
    console.error('Error sending email', { err })
    return Promise.reject(err)
  })
}

function validate(data: Data) {
  const { attachment, from, html, subject, to } = data

  const valid = attachment && from && html && to && subject

  return valid
}
