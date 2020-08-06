/* tslint:disable */
// NOTE Convert these to imports. Needs workaround for mockResolvedValue usage below
const handleSendEmail = require('./src/handle-send-email').default
const handler = require('./handler')
/* tslint:enable */

jest.mock('./src/handle-send-email')

const context = {
  awsRequestId: '',
  callbackWaitsForEmptyEventLoop: true,
  done: () => {},
  fail: () => {},
  functionName: '',
  functionVersion: '',
  getRemainingTimeInMillis: () => 100,
  invokedFunctionArn: '',
  logGroupName: '',
  logStreamName: '',
  memoryLimitInMB: 1024,
  succeed: () => {},
}

it('should handle error', () => {
  expect.assertions(3)

  handleSendEmail.mockRejectedValue(new Error('test'))

  const event = {
    cc: ['cc@lighthouse.io'],
    from: 'from@lighthouse.io',
    html: '<p>Hello World</p>',
    subject: 'Hi Friend!',
    to: ['to@lighthouse.io'],
  }

  return handler.run(event, context, (err, result) => {
    expect(err).toHaveProperty('message', 'test')
    expect(result).toBeUndefined()
    expect(handleSendEmail).toBeCalledWith(expect.anything(), event)
  })
})

it('should call handleSendEmail with event object', () => {
  expect.assertions(3)

  handleSendEmail.mockResolvedValue({
    MessageId: '123',
  })

  const event = {
    cc: ['cc@lighthouse.io'],
    from: 'from@lighthouse.io',
    html: '<p>Hello World</p>',
    subject: 'Hi Friend!',
    to: ['to@lighthouse.io'],
  }

  return handler.run(event, context, (err, result) => {
    expect(err).toBeNull()
    expect(result).toBeUndefined()
    expect(handleSendEmail).toBeCalledWith(expect.anything(), event)
  })
})

it('should call handleSendEmail with json value', () => {
  expect.assertions(3)

  handleSendEmail.mockResolvedValue({
    MessageId: '123',
  })

  const payload = {
    cc: ['cc@lighthouse.io'],
    from: 'from@lighthouse.io',
    html: '<p>Hello World</p>',
    subject: 'Hi Friend!',
    to: ['to@lighthouse.io'],
  }

  const event = {
    body: JSON.stringify(payload),
  }

  return handler.run(event, context, (err, result) => {
    expect(err).toBeNull()
    expect(result).toBeUndefined()
    expect(handleSendEmail).toBeCalledWith(expect.anything(), payload)
  })
})
