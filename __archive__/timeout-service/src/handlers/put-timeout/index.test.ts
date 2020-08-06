const mockPromise = jest.fn()
const mockPut = jest.fn().mockReturnValue({ promise: mockPromise })
const mockDocumentClient = jest
  .fn()
  .mockImplementation(() => ({ put: mockPut }))

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: mockDocumentClient,
  },
}))

import putTimeout from './'

describe('putTimeout', () => {
  const MOCK_MESSAGE = `{
    "bucket":"2018-08-15T22:00:00.000Z",
    "id":"123456789",
    "expiration":"2018-08-15T22:15:00.000Z",
    "resource":"testing"
  }`
  const MOCK_RESPONSE = {}
  const MOCK_TABLE = 'timeouts'

  const event = { Records: [{ Sns: { Message: MOCK_MESSAGE } }] }
  const context = {}
  const callback = jest.fn()

  beforeEach(() => (process.env.TABLE_TIMEOUTS = MOCK_TABLE))

  afterEach(() => {
    jest.clearAllMocks()
    mockPromise.mockReset()
  })

  it('should call put', async () => {
    mockPromise.mockResolvedValue(MOCK_RESPONSE)

    await putTimeout(event, context, callback)

    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(mockPut).toBeCalledWith({
      Item: {
        bucket: '2018-08-15T22:00:00.000Z',
        id: '123456789',
        expiration: '2018-08-15T22:15:00.000Z',
        resource: 'testing',
      },
      TableName: MOCK_TABLE,
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(null, MOCK_RESPONSE)
  })

  it('should catch errors', async () => {
    const error = new Error()
    mockPromise.mockRejectedValue(error)

    await putTimeout(event, context, callback)

    expect(mockPut).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(error)
  })
})
