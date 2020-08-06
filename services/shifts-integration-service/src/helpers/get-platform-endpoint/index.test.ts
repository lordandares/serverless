const AWSMock = require('aws-sdk-mock')
const AWS = require('aws-sdk')

AWSMock.setSDKInstance(AWS)

import getPlatformEndpoint from './'

describe('helpers :: getPlatformEndpoint', () => {
  beforeAll(() => {
    process.env.AWS_SNS_IOS_ARN = 'arn:aws:sns:us-east-1:0123456789012:ios-arn'
    process.env.AWS_SNS_IOS_SERVICE = 'ios'
  })

  afterEach(() => AWSMock.restore())

  afterAll(() => {
    process.env.AWS_SNS_IOS_ARN = ''
    process.env.AWS_SNS_IOS_SERVICE = ''
  })

  it('should return if a deviceToken is missing', async () => {
    const createPlatformEndpointMock = jest.fn((opt, cb) => cb())

    AWSMock.mock('SNS', 'createPlatformEndpoint', createPlatformEndpointMock)

    const client = new AWS.SNS()

    const receiver = {
      deviceToken: '',
      platform: 'ios',
    }

    const result = await getPlatformEndpoint(client, receiver)

    expect(result).toBeUndefined()

    expect(createPlatformEndpointMock).toHaveBeenCalledTimes(0)
  })

  it('should return if a platform is missing', async () => {
    const createPlatformEndpointMock = jest.fn((opt, cb) => cb())

    AWSMock.mock('SNS', 'createPlatformEndpoint', createPlatformEndpointMock)

    const client = new AWS.SNS()

    const receiver = {
      deviceToken: 'token',
      platform: '',
    }

    const result = await getPlatformEndpoint(client, receiver)

    expect(result).toBeUndefined()

    expect(createPlatformEndpointMock).toHaveBeenCalledTimes(0)
  })

  it('should create a platform endpoint', async () => {
    const createPlatformEndpointMock = jest.fn((opt, cb) =>
      cb(null, {
        Endpoint: 'foo-bar',
      }),
    )

    AWSMock.mock('SNS', 'createPlatformEndpoint', createPlatformEndpointMock)

    const client = new AWS.SNS()

    const receiver = {
      deviceToken: 'token',
      platform: 'ios',
    }

    const result = await getPlatformEndpoint(client, receiver)

    expect(result).toEqual({
      Endpoint: 'foo-bar',
    })

    expect(createPlatformEndpointMock).toHaveBeenCalledTimes(1)
  })
})
