const mockPromise = jest.fn()
const mockDelete = jest.fn().mockReturnValue({ promise: mockPromise })
const mockDocumentClient = jest
  .fn()
  .mockImplementation(() => ({ delete: mockDelete }))

jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: mockDocumentClient,
  },
}))

import deleteTimeout from './'

describe('deleteTimeout', () => {
  const MOCK_ID = '123456789'
  const MOCK_MESSAGE = `{"id":"${MOCK_ID}"}`
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

  it('should call deleteItem', async () => {
    mockPromise.mockResolvedValue(MOCK_RESPONSE)

    await deleteTimeout(event, context, callback)

    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(mockDelete).toBeCalledWith({
      Key: { id: MOCK_ID },
      TableName: MOCK_TABLE,
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(null, MOCK_RESPONSE)
  })

  it('should catch errors', async () => {
    const error = new Error()
    mockPromise.mockRejectedValue(error)

    await deleteTimeout(event, context, callback)

    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toBeCalledWith(error)
  })
})
