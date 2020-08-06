const AWSMock = require('aws-sdk-mock')
const AWS = require('aws-sdk')

AWSMock.setSDKInstance(AWS)

jest.mock('../')

import { getSnsPayload, validateEndpointAttributes } from '../'
import sendMessage from './'

describe('helpers :: sendMessage', () => {
  beforeAll(() => AWSMock.mock('SNS', 'publish', 'sns-successful'))
  afterAll(() => AWSMock.restore())

  beforeEach(() => jest.resetAllMocks())

  it('should publish an SNS message for each endpoint', async () => {
    expect.assertions(7)

    getSnsPayload.mockReturnValue({ Message: 'Reject shift message' })
    validateEndpointAttributes.mockResolvedValue()

    const client = new AWS.SNS()

    const endpoints = [
      {
        EndpointArn: 'arn:aws:sns:us-east-1:123456789012:endpoint-1',
        ResponseMetadata: [],
      },
      {
        EndpointArn: 'arn:aws:sns:us-east-1:123456789012:endpoint-2',
        ResponseMetadata: [],
      },
    ]
    const params = {
      message: 'Reject shift message',
      title: 'Notification',
      type: 'shift-notification',
    }

    const result = await sendMessage(client, endpoints, params)

    expect(validateEndpointAttributes).toHaveBeenCalledTimes(2)
    expect(validateEndpointAttributes).toHaveBeenNthCalledWith(
      1,
      client,
      'arn:aws:sns:us-east-1:123456789012:endpoint-1',
    )
    expect(validateEndpointAttributes).toHaveBeenNthCalledWith(
      2,
      client,
      'arn:aws:sns:us-east-1:123456789012:endpoint-2',
    )

    expect(getSnsPayload).toHaveBeenCalledTimes(2)
    expect(getSnsPayload).toHaveBeenNthCalledWith(1, {
      endpointArn: 'arn:aws:sns:us-east-1:123456789012:endpoint-1',
      ...params,
    })
    expect(getSnsPayload).toHaveBeenNthCalledWith(2, {
      endpointArn: 'arn:aws:sns:us-east-1:123456789012:endpoint-2',
      ...params,
    })

    expect(result).toEqual(['sns-successful', 'sns-successful'])
  })
})
