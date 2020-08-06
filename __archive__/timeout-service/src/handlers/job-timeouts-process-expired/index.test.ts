const mockPutMetricData = jest.fn().mockReturnValue({ promise: jest.fn() })
const mockDocumentClient = jest.fn()
const mockSns = jest.fn()

jest.mock('aws-sdk', () => ({
  CloudWatch: jest.fn().mockImplementation(() => ({
    putMetricData: mockPutMetricData,
  })),
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => mockDocumentClient),
  },
  SNS: jest.fn().mockImplementation(() => mockSns),
}))

jest.mock('../../helpers/get-expired-timeouts')
jest.mock('../../helpers/get-timeout-resources-map')
jest.mock('../../helpers/send-timeout-notifications')

const getExpiredTimeouts = require('../../helpers/get-expired-timeouts').default
const getTimeoutResourcesMap = require('../../helpers/get-timeout-resources-map')
  .default
const sendTimeoutNotifications = require('../../helpers/send-timeout-notifications')
  .default

import jobTimeoutsProcessExpired from './'

describe('handler', () => {
  const MOCK_TABLE_TIMEOUTS = 'timeouts'
  const MOCK_TABLE_TIMEOUT_RESOURCES = 'timeouts'

  const event = { region: 'us-east-1' }
  const context = { functionName: 'testing' }
  const callback = jest.fn()

  beforeEach(() => {
    process.env.TABLE_TIMEOUTS = MOCK_TABLE_TIMEOUTS
    process.env.TABLE_TIMEOUT_RESOURCES = MOCK_TABLE_TIMEOUT_RESOURCES
  })

  afterEach(() => jest.clearAllMocks())

  it('should run', async () => {
    const MOCK_RESPONSE_MAP = {}
    const MOCK_TIMEOUTS = []
    const MOCK_SNS_RESPONSES = []

    getExpiredTimeouts.mockResolvedValue(MOCK_TIMEOUTS)
    getTimeoutResourcesMap.mockResolvedValue(MOCK_RESPONSE_MAP)
    sendTimeoutNotifications.mockResolvedValue(MOCK_SNS_RESPONSES)

    await jobTimeoutsProcessExpired(event, context, callback)

    expect(getExpiredTimeouts).toHaveBeenCalledTimes(1)
    expect(getExpiredTimeouts).toBeCalledWith({
      ddb: mockDocumentClient,
      table: MOCK_TABLE_TIMEOUTS,
    })

    expect(getTimeoutResourcesMap).toHaveBeenCalledTimes(1)
    expect(getTimeoutResourcesMap).toBeCalledWith({
      ddb: mockDocumentClient,
      table: MOCK_TABLE_TIMEOUT_RESOURCES,
    })

    expect(sendTimeoutNotifications).toHaveBeenCalledTimes(1)
    expect(sendTimeoutNotifications).toBeCalledWith({
      sns: mockSns,
      timeouts: MOCK_TIMEOUTS,
      resourceMap: MOCK_RESPONSE_MAP,
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(null, MOCK_SNS_RESPONSES)
  })

  it('should send batch count metric data', async () => {
    const MOCK_TIMEOUTS = [{ id: '1' }, { id: '1' }, { id: '1' }]
    getExpiredTimeouts.mockResolvedValue(MOCK_TIMEOUTS)

    await jobTimeoutsProcessExpired(event, context, callback)

    expect(mockPutMetricData).toHaveBeenCalledTimes(1)
    expect(mockPutMetricData).toBeCalledWith({
      MetricData: [
        {
          Dimensions: [
            {
              Name: 'Lambda',
              Value: context.functionName,
            },
          ],
          MetricName: 'BatchCount',
          Unit: 'Count',
          Value: MOCK_TIMEOUTS.length,
        },
      ],
      Namespace: 'TimeoutService',
    })
  })

  it('should catch errors', async () => {
    const error = new Error()
    getExpiredTimeouts.mockRejectedValue(error)

    await jobTimeoutsProcessExpired(event, context, callback)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(error)
  })
})
