const AWSMock = require('aws-sdk-mock')
const AWS = require('aws-sdk')

AWSMock.setSDKInstance(AWS)

import validateEndpointAttributes from './'

describe('helpers :: validateEndpointAttributes', () => {
  afterEach(() => AWSMock.restore())

  it('should validate that an endpoint is active', async () => {
    expect.assertions(3)

    const getEndpointAttributesMock = jest.fn((opts, cb) =>
      cb(null, {
        Attributes: {
          Enabled: 'true',
        },
      }),
    )

    const setEndpointAttributesMock = jest.fn((opts, cb) => cb())

    AWSMock.mock('SNS', 'getEndpointAttributes', getEndpointAttributesMock)
    AWSMock.mock('SNS', 'setEndpointAttributes', setEndpointAttributesMock)

    const client = new AWS.SNS()
    const endpointArn = 'arn:aws:sns:us-east-1:000000000000:active-endpoint'

    await validateEndpointAttributes(client, endpointArn)

    expect(getEndpointAttributesMock).toHaveBeenCalledTimes(1)
    expect(getEndpointAttributesMock.mock.calls[0][0]).toEqual({
      EndpointArn: 'arn:aws:sns:us-east-1:000000000000:active-endpoint',
    })

    expect(setEndpointAttributesMock).toHaveBeenCalledTimes(0)
  })
})

it('should set a disabled endpoint to active', async () => {
  expect.assertions(4)

  const getEndpointAttributesMock = jest.fn((opts, cb) =>
    cb(null, {
      Attributes: {
        Enabled: 'false',
        Foo: 'bar',
      },
    }),
  )

  const setEndpointAttributesMock = jest.fn((opts, cb) =>
    cb(null, {
      Attributes: {
        Enabled: 'true',
        Foo: 'bar',
      },
    }),
  )

  AWSMock.mock('SNS', 'getEndpointAttributes', getEndpointAttributesMock)
  AWSMock.mock('SNS', 'setEndpointAttributes', setEndpointAttributesMock)

  const client = new AWS.SNS()
  const endpointArn = 'arn:aws:sns:us-east-1:000000000000:disabled-endpoint'

  await validateEndpointAttributes(client, endpointArn)

  expect(getEndpointAttributesMock).toHaveBeenCalledTimes(1)
  expect(getEndpointAttributesMock.mock.calls[0][0]).toEqual({
    EndpointArn: 'arn:aws:sns:us-east-1:000000000000:disabled-endpoint',
  })

  expect(setEndpointAttributesMock).toHaveBeenCalledTimes(1)
  expect(setEndpointAttributesMock.mock.calls[0][0]).toEqual({
    EndpointArn: 'arn:aws:sns:us-east-1:000000000000:disabled-endpoint',
    Attributes: {
      Enabled: 'true',
      Foo: 'bar',
    },
  })
})
