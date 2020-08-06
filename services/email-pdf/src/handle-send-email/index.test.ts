/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const handleSendEmail = require('./index').default
/* tslint:enable */

it('should error for missing transporter', () => {
  expect.assertions(1)

  const data = {}

  const mockTransporter = undefined
  const promise = handleSendEmail(mockTransporter, data)

  expect(promise).rejects.toHaveProperty(
    'message',
    'Missing `transporter` argument',
  )
})

it('should error for empty data', () => {
  expect.assertions(2)

  const data = {}

  const mockTransporter = getMockTransporter()
  const promise = handleSendEmail(mockTransporter, data)

  expect(promise).rejects.toHaveProperty(
    'message',
    'Invalid data supplied to sendEmail',
  )

  expect(mockTransporter.sendMail).not.toHaveBeenCalled()
})

it('should error for invalid data', () => {
  expect.assertions(2)

  const data = {
    attachment: {
      filename: 'audit.pdf',
      url: 'http://files.lighthouse.io/attachment.pdf',
    },
    from: 'from@lighthouse.io',
    to: '', // no email addresses
    html: '<p>Hello World</p>',
    subject: 'Hi Friend!',
  }

  const mockTransporter = getMockTransporter()
  const promise = handleSendEmail(mockTransporter, data)

  expect(promise).rejects.toHaveProperty(
    'message',
    'Invalid data supplied to sendEmail',
  )

  expect(mockTransporter.sendMail).not.toHaveBeenCalled()
})

it('should handle transporter error', () => {
  expect.assertions(2)

  const data = {
    attachment: {
      filename: 'audit.pdf',
      url: 'http://files.lighthouse.io/attachment.pdf',
    },
    from: 'from@lighthouse.io',
    to: ['to@lighthouse.io'],
    html: '<p>Hello World</p>',
    subject: 'Hi Friend!',
  }

  const mockTransporter = {
    sendMail: jest.fn().mockRejectedValue(new Error('AWS Error')),
  }

  const promise = handleSendEmail(mockTransporter, data)

  expect(promise).rejects.toHaveProperty('message', 'AWS Error')

  expect(mockTransporter.sendMail).toHaveBeenCalled()
})

it('should send email using ses', () => {
  expect.assertions(2)

  const data = {
    attachment: {
      filename: 'audit.pdf',
      url: 'http://files.lighthouse.io/attachment.pdf',
    },
    from: 'from@lighthouse.io',
    to: ['to@lighthouse.io'],
    cc: ['cc@lighthouse.io'],
    html: '<p>Hello World</p>',
    subject: 'Hi Friend!',
  }

  const mockTransporter = getMockTransporter()

  handleSendEmail(mockTransporter, data).then(result => {
    expect(result).toBeTruthy()
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      attachments: [
        {
          filename: 'audit.pdf',
          path: 'http://files.lighthouse.io/attachment.pdf',
        },
      ],
      from: 'from@lighthouse.io',
      to: ['to@lighthouse.io'],
      cc: ['cc@lighthouse.io'],
      html: '<p>Hello World</p>',
      subject: 'Hi Friend!',
    })
  })
})

function getMockTransporter() {
  return {
    sendMail: jest.fn().mockResolvedValue({
      messageId: '123',
    }),
  }
}
